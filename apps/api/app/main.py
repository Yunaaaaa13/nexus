from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import engine, Base
from app.models import (
    Stock,
    MarketIndex,
    StockPrice,
    IndexPrice,
)
from app.routers.market import router as market_router
from app.routers import screener


app = FastAPI(
    title="NEXUS API",
    description="Indonesian Market Intelligence API",
    version="0.1.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(market_router)
app.include_router(screener.router)


@app.get("/")
def root():
    return {
        "name": "NEXUS API",
        "version": "0.1.0",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(e)
        }
