-- PostgreSQL schema for Laundry API
-- Entities: customers, orders, order_items, order_events

CREATE TABLE IF NOT EXISTS customers (
    id              BIGSERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, phone)
);

-- Inventory catalog: productos en venta, insumos o variantes de LA TINTO
CREATE TABLE IF NOT EXISTS product_types (
    product_type_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description       VARCHAR NOT NULL,
    unit_price_cents  INTEGER NOT NULL DEFAULT 0,
    date_time_created TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE product_types
    ADD COLUMN IF NOT EXISTS unit_price_cents INTEGER NOT NULL DEFAULT 0;

-- Información de stock
CREATE TABLE IF NOT EXISTS stock (
    stock_id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_type_id    INTEGER NOT NULL REFERENCES product_types(product_type_id),
    available_quantity INTEGER NOT NULL DEFAULT 0,
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_product_type_id ON stock(product_type_id);

CREATE TABLE IF NOT EXISTS orders (
    id                  BIGSERIAL PRIMARY KEY,
    customer_id         BIGINT NOT NULL REFERENCES customers(id),
    status              TEXT NOT NULL CHECK (status IN ('received','in_process','ready','delivered','canceled')),
    pickup_notes        TEXT,
    delivery_notes      TEXT,
    total_items         INTEGER NOT NULL DEFAULT 0,
    total_price_cents   INTEGER NOT NULL DEFAULT 0,
    pickup_at           TIMESTAMPTZ,
    delivery_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku                 TEXT NOT NULL,
    description         TEXT,
    qty                 INTEGER NOT NULL CHECK (qty > 0),
    unit_price_cents    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_events (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          TEXT NOT NULL CHECK (status IN ('received','in_process','ready','delivered','canceled')),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

-- Keep updated_at fresh on updates
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
    ) THEN
        CREATE TRIGGER trg_orders_updated_at
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
    END IF;
END;
$$;
