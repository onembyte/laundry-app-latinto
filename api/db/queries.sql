-- Parameterized query snippets for FastAPI usage

-- Create or reuse a customer based on (name, phone)
-- $1: name, $2: phone, $3: email, $4: address
INSERT INTO customers (name, phone, email, address)
VALUES ($1, $2, $3, $4)
ON CONFLICT (name, phone) DO UPDATE
SET email = EXCLUDED.email,
    address = EXCLUDED.address
RETURNING id;

-- Create order header
-- $1: customer_id, $2: status, $3: pickup_notes, $4: delivery_notes, $5: pickup_at, $6: delivery_at
INSERT INTO orders (customer_id, status, pickup_notes, delivery_notes, pickup_at, delivery_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, created_at;

-- Bulk insert items for an order
-- $1: order_id, $2: sku, $3: description, $4: qty, $5: unit_price_cents
INSERT INTO order_items (order_id, sku, description, qty, unit_price_cents)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- Persist a status change/event
-- $1: order_id, $2: status, $3: note, $4: created_by
INSERT INTO order_events (order_id, status, note, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, created_at;

-- Update order totals and status in one statement
-- $1: total_items, $2: total_price_cents, $3: status, $4: order_id
UPDATE orders
SET total_items = $1, total_price_cents = $2, status = $3
WHERE id = $4
RETURNING id;

-- Order detail with items and latest status event
-- $1: order_id
SELECT
    o.id,
    o.status,
    o.total_items,
    o.total_price_cents,
    o.pickup_at,
    o.delivery_at,
    o.created_at,
    o.updated_at,
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone,
    c.email,
    c.address,
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'id', oi.id,
            'sku', oi.sku,
            'description', oi.description,
            'qty', oi.qty,
            'unit_price_cents', oi.unit_price_cents
        ) ORDER BY oi.id)
        FROM order_items oi WHERE oi.order_id = o.id
    ), '[]'::jsonb) AS items,
    (
        SELECT jsonb_build_object(
            'id', oe.id,
            'status', oe.status,
            'note', oe.note,
            'created_at', oe.created_at,
            'created_by', oe.created_by
        )
        FROM order_events oe
        WHERE oe.order_id = o.id
        ORDER BY oe.created_at DESC
        LIMIT 1
    ) AS latest_event
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.id = $1;

-- Most recent orders for dashboard
-- $1: limit
SELECT
    o.id,
    o.status,
    o.total_items,
    o.total_price_cents,
    o.created_at,
    c.name AS customer_name
FROM orders o
JOIN customers c ON c.id = o.customer_id
ORDER BY o.created_at DESC
LIMIT $1;
