# Inventory Monitoring System

Integrated project with:

- Frontend UI design and functionality in `frontend`
- FastAPI API gateway in `backend/gateway`
- Spring Boot backend in `backend/coreservices`
- PostgreSQL schema/seed files in `database`

## Local Demo Run

```bash
cd backend\coreservices
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

```bash
cd backend\gateway
venv\Scripts\activate
python run.py
```

```bash
cd frontend
npm.cmd run dev
```

Open `http://localhost:5173`.

Seeded admin login:

- Email: `admin@inventory.com`
- Password: `admin123`
