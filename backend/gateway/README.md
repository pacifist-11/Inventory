# Inventory Monitoring Gateway

FastAPI gateway for the inventory monitoring dashboard. It follows the same style as the demo gateway and forwards requests to the Spring Boot core service.

## Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

FastAPI Swagger opens at `http://localhost:8000/docs`.

The gateway expects Spring Boot to run at `http://localhost:8001`. You can change that with `SPRING_URL` in `.env`.

## Main Endpoints

- `POST /authservice/signin`
- `POST /authservice/signup`
- `GET /authservice/profile`
- `GET /inventoryservice/items`
- `POST /inventoryservice/items`
- `PUT /inventoryservice/items/{item_id}`
- `PATCH /inventoryservice/items/{item_id}/adjust`
- `DELETE /inventoryservice/items/{item_id}`
- `GET /inventoryservice/summary`
- `GET /inventoryservice/activity`
- `GET /inventoryservice/queue`
- `GET /inventoryservice/locations`
- `GET /inventoryservice/semantic-queries`
