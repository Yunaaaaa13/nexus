from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.stock import Stock
from app.models.stock_price import StockPrice
from app.services.analytics.movers import get_top_movers
from app.services.analytics.breadth import get_market_breadth
from app.services.analytics.sectors import (
    get_sector_performance
)

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


@router.get("/indices/overview")
async def get_index_overview():
    try:
        ihsg = provider.get_index_overview("IHSG")

        return {
            "success": True,
            "data": [
                ihsg,
                {
                    "symbol": "LQ45",
                    "name": "LQ45",
                    "price": None,
                    "change_percent": None,
                    "available": False,
                },
                {
                    "symbol": "IDX30",
                    "name": "IDX30",
                    "price": None,
                    "change_percent": None,
                    "available": False,
                },
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch index overview: {str(e)}",
        )


@router.get("/indices/intraday")
@router.get("/indices/{symbol}/intraday")
async def get_index_intraday(symbol: str = "IHSG"):
    try:
        data = provider.get_index_intraday(symbol=symbol.upper(), interval="5m")

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch index intraday data: {str(e)}",
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


@router.get("/movers")
async def get_market_movers(
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
):
    try:
        data = get_top_movers(
            db=db,
            limit=limit,
        )

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate market movers: {str(e)}",
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


# ============================================================
# STORED MARKET DATA (DATABASE)
# ============================================================

@router.get("/stocks/{symbol}/history")
async def get_stock_history(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        symbol = symbol.upper()

        # Cari stock
        stock = (
            db.query(Stock)
            .filter(Stock.symbol == symbol)
            .first()
        )

        if not stock:
            raise HTTPException(
                status_code=404,
                detail=f"Stock {symbol} not found",
            )

        # Ambil historical price
        prices = (
            db.query(StockPrice)
            .filter(StockPrice.stock_id == stock.id)
            .order_by(StockPrice.timestamp.asc())
            .all()
        )

        return {
            "success": True,
            "data": {
                "symbol": stock.symbol,
                "name": stock.name,
                "count": len(prices),
                "prices": [
                    {
                        "timestamp": price.timestamp.isoformat(),
                        "open": float(price.open),
                        "high": float(price.high),
                        "low": float(price.low),
                        "close": float(price.close),
                        "volume": price.volume,
                    }
                    for price in prices
                ],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stored stock history: {str(e)}",
        )
@router.get("/breadth")
async def get_breadth(
    db: Session = Depends(get_db),
):
    try:
        data = get_market_breadth(db)

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate market breadth: "
                f"{str(e)}"
            ),
        )


@router.get("/sectors")
async def get_sectors(
    db: Session = Depends(get_db),
):
    try:
        data = get_sector_performance(db)

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate sector performance: "
                f"{str(e)}"
            ),
        )

