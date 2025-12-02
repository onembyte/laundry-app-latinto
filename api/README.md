# Laundry API (FastAPI)

## Local dev
```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # optional
uvicorn app:app --reload --port 8080
```

Test:
```bash
curl http://localhost:8080/api/hello
```

## Database
- Default: PostgreSQL. Configure `DATABASE_URL` in `.env` (see `.env.example`).
- Create DB + run schema:
  ```bash
  createdb laundry
  psql $DATABASE_URL -f db/schema.sql
  psql $DATABASE_URL -f db/seed.sql  # optional seed data
  ```
- The FastAPI app opens a small psycopg connection pool on startup and uses transactions per request.

## Container
```bash
docker build -t laundry-api ./api
docker run -p 8080:8080 -e DATABASE_URL=$DATABASE_URL laundry-api
```

## Sample order payload
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": { "name": "Alice", "phone": "555-1234" },
    "pickup_notes": "Leave with concierge",
    "delivery_notes": "Call when arriving",
    "items": [
      { "sku": "shirt", "qty": 2, "unit_price_cents": 400 },
      { "sku": "pants", "qty": 1, "unit_price_cents": 1200 }
    ]
  }'
```
