from fastapi import APIRouter, HTTPException
import httpx
from app.services.market_data.providers.free_provider import (
    FreeMarketDataProvider,
)

router = APIRouter(
    prefix="/api/market",
    tags=["Market"],
)

provider = FreeMarketDataProvider()


@router.get("/indices")
async def get_indices():
    try:
        data = await provider.get_index("IHSG")
        return {
            "success": True,
            "data": data,
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=e.response.json() if "application/json" in e.response.headers.get("content-type", "") else e.response.text,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch market data: {str(e)}",
        )
