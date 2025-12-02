-- Seed data for local development
INSERT INTO customers (name, phone, email, address)
VALUES
    ('Walk-in Customer', null, null, null)
ON CONFLICT DO NOTHING;

-- Sample orders to smoke-test the API manually
WITH base_customer AS (
    SELECT id FROM customers WHERE name = 'Walk-in Customer' LIMIT 1
), inserted_orders AS (
    INSERT INTO orders (customer_id, status, pickup_notes, delivery_notes, total_items, total_price_cents)
    SELECT id, 'received', 'Drop-off at front desk', 'Deliver to apt 3B', 4, 2400 FROM base_customer
    RETURNING id
)
INSERT INTO order_items (order_id, sku, description, qty, unit_price_cents)
SELECT io.id, i.sku, i.description, i.qty, i.unit_price_cents
FROM inserted_orders io
JOIN (VALUES
    ('shirt', 'Cotton shirt', 2, 400),
    ('pants', 'Denim pants', 1, 1200),
    ('towel', 'Bath towel', 1, 400)
) AS i(sku, description, qty, unit_price_cents)
    ON TRUE;
