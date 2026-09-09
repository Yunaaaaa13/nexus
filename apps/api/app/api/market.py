from fastapi import APIRouter, HTTPException
from app.services.market_data.providers.yahoo_provider import (
    YahooFinanceProvider,
)

router = APIRouter(
    prefix="/api/market",
    tags=["Market"],
)

provider = YahooFinanceProvider()


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
