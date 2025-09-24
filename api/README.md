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

## Container
```bash
docker build -t laundry-api ./api
docker run -p 8080:8080 laundry-api
```
