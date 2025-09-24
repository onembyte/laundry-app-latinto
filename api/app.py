from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="Laundry API", version="0.1.0")

# CORS: lock this down to your domain in prod
origins = [os.getenv("CORS_ORIGIN", "*")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OrderItem(BaseModel):
    sku: str
    qty: int

class CreateOrder(BaseModel):
    customer_name: str
    items: list[OrderItem]

@app.get("/api/hello")
def hello():
    return {"ok": True, "msg": "Laundry API up!"}

@app.post("/api/orders")
def create_order(payload: CreateOrder):
    total_items = sum(i.qty for i in payload.items)
    return {
        "ok": True,
        "order_id": 123,
        "customer": payload.customer_name,
        "items": total_items,
    }

@app.get("/healthz")
def health():
    return {"status": "ok"}
