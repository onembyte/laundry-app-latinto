from datetime import datetime
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

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
    unit_price_cents: int


class StockAdjust(BaseModel):
    product_type_id: int
    quantity: int


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
    logger.info("DB pool initialized")


@app.on_event("shutdown")
def on_shutdown() -> None:
    if pool:
        pool.close()


@app.get("/api/hello")
def hello():
    return {"ok": True, "msg": "Laundry API up!"}


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
