import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from controllers import AuthenticationRouter, InventoryRouter

load_dotenv()

app = FastAPI(
    title="Inventory Monitoring Gateway API",
    description="FastAPI gateway that forwards requests to appropriate service/database.",
    version="1.0.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(AuthenticationRouter)
app.include_router(InventoryRouter)



@app.get("/", tags=["Health"])
def home():
    return {
        "message": "Inventory Monitoring Gateway started",
        "spring_core": os.getenv("SPRING_URL", "http://localhost:8001"),
        "swagger": "/docs",
    }
