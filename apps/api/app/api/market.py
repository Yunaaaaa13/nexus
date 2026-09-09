from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.market_data.providers.yahoo_provider import (
    YahooFinanceProvider,
)

from app.services.market_data.ingestion import (
    MarketDataIngestionService,
)


router = APIRouter(
    prefix="/api/market",
    tags=["Market"],
)


provider = YahooFinanceProvider()

ingestion_service = MarketDataIngestionService(
    provider=provider
)


@router.get("/indices")
async def get_indices():
    try:
        data = provider.get_index("IHSG")

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch index data: {str(e)}",
        )


@router.get("/stocks/{symbol}")
async def get_stock(symbol: str):
    try:
        data = provider.get_stock(symbol.upper())

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch stock data: {str(e)}",
        )


# ============================================================
# DATA INGESTION
# ============================================================

@router.post("/sync/index/{symbol}")
async def sync_index(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        result = ingestion_service.sync_index(
            db=db,
            symbol=symbol.upper(),
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync index data: {str(e)}",
        )


@router.post("/sync/stocks/{symbol}")
async def sync_stock(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        result = ingestion_service.sync_stock(
            db=db,
            symbol=symbol.upper(),
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync stock data: {str(e)}",
        )


@router.post("/sync/stocks/{symbol}/history")
async def sync_stock_history(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        result = ingestion_service.sync_stock_history(
            db=db,
            symbol=symbol.upper(),
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync stock historical data: {str(e)}",
        )

