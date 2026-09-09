from fastapi import FastAPI

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
