from datetime import datetime, timedelta
import logging
import os
import secrets

from fastapi import FastAPI, HTTPException, Response, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = FastAPI(title="Laundry API", version="0.1.0")
logger = logging.getLogger(__name__)

# CORS: lock this down to your domain in prod (comma-separated list supported)
origins = [o.strip() for o in os.getenv("CORS_ORIGIN", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database pool
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/laundry")
pool: ConnectionPool | None = None
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOWED_DOMAIN = os.getenv("GOOGLE_ALLOWED_DOMAINS", "").lower().strip()


class Customer(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    address: str | None = None


class OrderItem(BaseModel):
    sku: str
    qty: int
    description: str | None = None
    unit_price_cents: int | None = 0


class CreateOrder(BaseModel):
    customer: Customer
    items: list[OrderItem]
    pickup_notes: str | None = None
    delivery_notes: str | None = None
    pickup_at: datetime | None = None
    delivery_at: datetime | None = None


class ProductTypeCreate(BaseModel):
    description: str
    unit_price_cents: int | None = 0


class StockAdjust(BaseModel):
    product_type_id: int
    quantity: int


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    return pwd_context.verify(pw, hashed)


def create_session(user_id: int, hours: int = 24 * 7) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=hours)
    db_pool = get_pool()
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sessions (session_token, user_id, expires_at)
                VALUES (%s, %s, %s)
                """,
                (token, user_id, expires),
            )
            conn.commit()
    return token


def get_pool() -> ConnectionPool:
    if pool is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return pool


@app.on_event("startup")
def on_startup() -> None:
    """Initialize the PostgreSQL connection pool."""
    global pool
    pool = ConnectionPool(
        conninfo=DATABASE_URL,
        min_size=int(os.getenv("DB_POOL_MIN", "1")),
        max_size=int(os.getenv("DB_POOL_MAX", "5")),
        kwargs={"autocommit": False},
    )
    pool.open()
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            # Ensure unique index for stock upserts
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_product_type_id ON stock(product_type_id);")
            cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users(username);")

            admin_user = os.getenv("ADMIN_USERNAME")
            admin_pass = os.getenv("ADMIN_PASSWORD")
            if admin_user and admin_pass:
                cur.execute("SELECT user_id FROM users WHERE username = %s", (admin_user,))
                exists = cur.fetchone()
                if not exists:
                    cur.execute(
                        "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                        (admin_user, hash_password(admin_pass)),
                    )
                    logger.info("Seeded admin user '%s'", admin_user)
                conn.commit()
    logger.info("DB pool initialized")


@app.on_event("shutdown")
def on_shutdown() -> None:
    if pool:
        pool.close()


@app.get("/api/hello")
def hello():
    return {"ok": True, "msg": "Laundry API up!"}


@app.post("/api/auth/login")
def login(payload: LoginRequest, response: Response):
    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT user_id, password_hash, active FROM users WHERE username = %s", (payload.username,))
                row = cur.fetchone()
                if not row or not row["active"] or not verify_password(payload.password, row["password_hash"]):
                    raise HTTPException(status_code=401, detail="Invalid credentials")

                token = create_session(row["user_id"])
                response.set_cookie(
                    "session",
                    token,
                    httponly=True,
                    secure=COOKIE_SECURE,
                    samesite="lax",
                    max_age=60 * 60 * 24 * 7,
                    path="/",
                )
                return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to login: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to login")


@app.post("/api/auth/register")
def register(payload: RegisterRequest, response: Response):
    if len(payload.username.strip()) < 3 or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Username/password too short")

    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT 1 FROM users WHERE username = %s", (payload.username,))
                if cur.fetchone():
                    raise HTTPException(status_code=409, detail="Username already exists")

                cur.execute(
                    "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING user_id",
                    (payload.username, hash_password(payload.password)),
                )
                row = cur.fetchone()
                token = create_session(row["user_id"])
                response.set_cookie(
                    "session",
                    token,
                    httponly=True,
                    secure=COOKIE_SECURE,
                    samesite="lax",
                    max_age=60 * 60 * 24 * 7,
                    path="/",
                )
                return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to register: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to register")


@app.post("/api/auth/logout")
def logout(response: Response, session: str | None = Cookie(default=None)):
    if session:
        try:
            db_pool = get_pool()
            with db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM sessions WHERE session_token = %s", (session,))
                    conn.commit()
        except Exception:  # pragma: no cover
            logger.exception("Failed to delete session")
    response.delete_cookie("session", path="/")
    return {"ok": True}


@app.post("/api/auth/google")
def google_login(payload: dict, response: Response):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google login not configured")
    token = payload.get("id_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing id_token")

    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(status_code=401, detail="Invalid Google token issuer")
        email = (idinfo.get("email") or "").lower()
        sub = idinfo.get("sub")
        if ALLOWED_DOMAIN and email and not email.endswith("@" + ALLOWED_DOMAIN):
            raise HTTPException(status_code=403, detail="Email domain not allowed")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT user_id, active FROM users WHERE google_sub = %s OR email = %s
                    """,
                    (sub, email),
                )
                row = cur.fetchone()
                if row and not row["active"]:
                    raise HTTPException(status_code=403, detail="Account disabled")

                if not row:
                    cur.execute(
                        """
                        INSERT INTO users (username, email, google_sub, auth_provider, password_hash)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING user_id
                        """,
                        (email or f"google_{sub}", email or None, sub, "google", ""),
                    )
                    row = cur.fetchone()
                user_id = row["user_id"]

                session_token = create_session(user_id)
                response.set_cookie(
                    "session",
                    session_token,
                    httponly=True,
                    secure=COOKIE_SECURE,
                    samesite="lax",
                    max_age=60 * 60 * 24 * 7,
                    path="/",
                )
                return {"ok": True}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed Google login: %s", exc)
        raise HTTPException(status_code=500, detail="Failed Google login")


@app.post("/api/orders")
def create_order(payload: CreateOrder):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order requires at least one item")

    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    INSERT INTO customers (name, phone, email, address)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (name, phone) DO UPDATE
                    SET email = EXCLUDED.email,
                        address = EXCLUDED.address
                    RETURNING id;
                    """,
                    (
                        payload.customer.name,
                        payload.customer.phone,
                        payload.customer.email,
                        payload.customer.address,
                    ),
                )
                customer_id = cur.fetchone()["id"]

                cur.execute(
                    """
                    INSERT INTO orders (customer_id, status, pickup_notes, delivery_notes, pickup_at, delivery_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at;
                    """,
                    (
                        customer_id,
                        "received",
                        payload.pickup_notes,
                        payload.delivery_notes,
                        payload.pickup_at,
                        payload.delivery_at,
                    ),
                )
                order_row = cur.fetchone()
                order_id = order_row["id"]

                total_items = 0
                total_price_cents = 0
                for item in payload.items:
                    unit_price = item.unit_price_cents or 0
                    cur.execute(
                        """
                        INSERT INTO order_items (order_id, sku, description, qty, unit_price_cents)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id;
                        """,
                        (order_id, item.sku, item.description, item.qty, unit_price),
                    )
                    total_items += item.qty
                    total_price_cents += unit_price * item.qty

                cur.execute(
                    """
                    INSERT INTO order_events (order_id, status, note, created_by)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (order_id, "received", "Order created via API", "api"),
                )

                cur.execute(
                    """
                    UPDATE orders
                    SET total_items = %s, total_price_cents = %s
                    WHERE id = %s
                    RETURNING id;
                    """,
                    (total_items, total_price_cents, order_id),
                )

            conn.commit()

        return {
            "ok": True,
            "order_id": order_id,
            "customer": payload.customer.name,
            "items": total_items,
            "total_price_cents": total_price_cents,
        }
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive path
        logger.exception("Failed to create order: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create order")


@app.get("/api/product-types")
def list_product_types():
    """Return all product types with current available quantity."""
    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT
                        pt.product_type_id AS id,
                        pt.description,
                        pt.unit_price_cents,
                        pt.date_time_created,
                        COALESCE(s.available_quantity, 0) AS available_quantity,
                        COALESCE(s.updated_at, pt.date_time_created) AS updated_at
                    FROM product_types pt
                    LEFT JOIN stock s ON s.product_type_id = pt.product_type_id
                    ORDER BY pt.product_type_id DESC;
                    """
                )
                return {"ok": True, "data": cur.fetchall()}
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to list product types: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to list product types")


@app.post("/api/product-types")
def create_product_type(payload: ProductTypeCreate):
    if payload.unit_price_cents is not None and payload.unit_price_cents < 0:
        raise HTTPException(status_code=400, detail="Price must be non-negative")

    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    INSERT INTO product_types (description, date_time_created, unit_price_cents)
                    VALUES (%s, now(), COALESCE(%s, 0))
                    RETURNING product_type_id AS id, description, unit_price_cents, date_time_created;
                    """,
                    (payload.description, payload.unit_price_cents),
                )
                row = cur.fetchone()
                # Ensure stock entry exists for this product
                cur.execute(
                    """
                    INSERT INTO stock (product_type_id, available_quantity, updated_at)
                    VALUES (%s, 0, NOW())
                    ON CONFLICT (product_type_id) DO NOTHING;
                    """,
                    (row["id"],),
                )
                conn.commit()
                return {"ok": True, "data": row}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to create product type: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to create product type: {exc}")


@app.post("/api/stock/add")
def stock_add(payload: StockAdjust):
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT 1 FROM product_types WHERE product_type_id = %s", (payload.product_type_id,))
                if cur.fetchone() is None:
                    raise HTTPException(status_code=404, detail="Product type not found")

                cur.execute(
                    """
                    INSERT INTO stock (product_type_id, available_quantity, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (product_type_id)
                    DO UPDATE SET
                        available_quantity = stock.available_quantity + EXCLUDED.available_quantity,
                        updated_at = NOW()
                    RETURNING stock_id AS id, product_type_id, available_quantity, updated_at;
                    """,
                    (payload.product_type_id, payload.quantity),
                )
                conn.commit()
                return {"ok": True, "data": cur.fetchone()}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to add stock: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to add stock: {exc}")


@app.post("/api/stock/subtract")
def stock_subtract(payload: StockAdjust):
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT available_quantity FROM stock WHERE product_type_id = %s", (payload.product_type_id,))
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(status_code=404, detail="Stock row not found")

                available = row["available_quantity"]
                if available - payload.quantity < 0:
                    raise HTTPException(status_code=400, detail="Insufficient stock")

                cur.execute(
                    """
                    UPDATE stock
                    SET available_quantity = available_quantity - %s
                    WHERE product_type_id = %s
                    RETURNING stock_id AS id, product_type_id, available_quantity, updated_at;
                    """,
                    (payload.quantity, payload.product_type_id),
                )
                conn.commit()
                return {"ok": True, "data": cur.fetchone()}
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to subtract stock: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to subtract stock: {exc}")


@app.get("/api/stock")
def list_stock():
    """Return stock rows joined with product descriptions."""
    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT
                        s.stock_id AS id,
                        s.product_type_id,
                        pt.description,
                        s.available_quantity,
                        s.updated_at
                    FROM stock s
                    JOIN product_types pt ON pt.product_type_id = s.product_type_id
                    ORDER BY s.updated_at DESC NULLS LAST, s.stock_id DESC;
                    """
                )
                return {"ok": True, "data": cur.fetchall()}
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to list stock: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to list stock")


@app.get("/healthz")
def health():
    try:
        db_pool = get_pool()
        with db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
    except Exception:
        raise HTTPException(status_code=503, detail="database unavailable")
    return {"status": "ok"}
