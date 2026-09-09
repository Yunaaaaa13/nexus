from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import engine


app = FastAPI(
    title="NEXUS API",
    description="Indonesian Market Intelligence API",
    version="0.1.0",
)


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
