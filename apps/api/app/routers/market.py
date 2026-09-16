from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session

from app.database.database import get_db, SessionLocal
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
def get_indices():
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
def get_index_overview():
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
def get_index_intraday(symbol: str = "IHSG"):
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


VALID_PERIODS = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "ALL"]


@router.get("/indices/{symbol}/history")
def get_index_history(symbol: str = "IHSG", period: str = "1D", interval: str = ""):
    period = period.upper()
    if period not in VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period '{period}'. Must be one of: {', '.join(VALID_PERIODS)}",
        )

    try:
        data = provider.get_index_history(symbol=symbol.upper(), period=period, interval=interval)

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch index history data: {str(e)}",
        )


@router.get("/stocks")
def get_all_stocks(
    limit: int = 50,
    offset: int = 0,
):
    try:
        limit = max(1, min(limit, 100))
        offset = max(0, offset)

        db = SessionLocal()

        try:
            # ==================================================
            # TOTAL STOCKS
            # ==================================================

            total = db.execute(
                select(func.count(Stock.id))
            ).scalar_one()

            # ==================================================
            # STEP 1
            # Ambil stocks sesuai pagination TERLEBIH DAHULU
            # ==================================================

            stocks = db.execute(
                select(Stock)
                .order_by(Stock.symbol.asc())
                .offset(offset)
                .limit(limit)
            ).scalars().all()

            if not stocks:
                return {
                    "success": True,
                    "data": [],
                    "pagination": {
                        "total": total,
                        "limit": limit,
                        "offset": offset,
                        "returned": 0,
                    },
                }

            # ==================================================
            # STEP 2
            # Ambil ID stock yang hanya ada di halaman ini
            # ==================================================

            stock_ids = [
                stock.id
                for stock in stocks
            ]

            # ==================================================
            # STEP 3
            # Ambil 2 harga terbaru per saham via LATERAL join
            # (hanya membaca 2 baris terakhir per saham dari index)
            # ==================================================

            stock_ids_sql = ", ".join(
                str(sid)
                for sid in stock_ids
            )

            price_rows = db.execute(
                text(
                    f"""
                    SELECT
                        sp.stock_id,
                        sp.timestamp,
                        sp.open,
                        sp.high,
                        sp.low,
                        sp.close,
                        sp.volume
                    FROM stock_prices sp
                    JOIN LATERAL (
                        SELECT sp2.id
                        FROM stock_prices sp2
                        WHERE sp2.stock_id = sp.stock_id
                        ORDER BY sp2.timestamp DESC
                        LIMIT 2
                    ) top2 ON top2.id = sp.id
                    WHERE sp.stock_id IN ({stock_ids_sql})
                    ORDER BY sp.stock_id, sp.timestamp DESC
                    """
                )
            ).all()

            # ==================================================
            # STEP 4
            # Simpan hanya 2 record terbaru per stock
            # ==================================================

            prices_by_stock = {}

            for price in price_rows:

                stock_id = price.stock_id

                if stock_id not in prices_by_stock:
                    prices_by_stock[stock_id] = []

                if len(prices_by_stock[stock_id]) < 2:
                    prices_by_stock[stock_id].append(price)

            # ==================================================
            # STEP 5
            # Build response
            # ==================================================

            data = []

            for stock in stocks:

                prices = prices_by_stock.get(
                    stock.id,
                    []
                )

                if not prices:
                    data.append({
                        "symbol": stock.symbol,
                        "name": stock.name,
                        "sector": stock.sector,
                        "price": None,
                        "previous_close": None,
                        "change": None,
                        "change_percent": None,
                        "volume": 0,
                        "timestamp": None,
                    })

                    continue

                latest = prices[0]

                previous = (
                    prices[1]
                    if len(prices) > 1
                    else None
                )

                price = (
                    float(latest.close)
                    if latest.close is not None
                    else None
                )

                previous_close = (
                    float(previous.close)
                    if previous is not None
                    and previous.close is not None
                    else None
                )

                change = None
                change_percent = None

                if (
                    price is not None
                    and previous_close is not None
                    and previous_close != 0
                ):
                    change = (
                        price
                        - previous_close
                    )

                    change_percent = (
                        change
                        / previous_close
                        * 100
                    )

                data.append({
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "sector": stock.sector,
                    "price": price,
                    "previous_close": previous_close,
                    "change": change,
                    "change_percent": change_percent,
                    "volume": (
                        int(latest.volume)
                        if latest.volume is not None
                        else 0
                    ),
                    "timestamp": (
                        latest.timestamp.isoformat()
                        if latest.timestamp
                        else None
                    ),
                })

            return {
                "success": True,
                "data": data,
                "pagination": {
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "returned": len(data),
                },
            }

        finally:
            db.close()

    except Exception as e:

        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to fetch stock list: "
                f"{str(e)}"
            ),
        )

@router.get("/stocks/{symbol}")
def get_stock(symbol: str):
    try:
        data = provider.get_stock(
            symbol.upper()
        )

        return {
            "success": True,
            "data": data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to fetch stock data: "
                f"{str(e)}"
            ),
        )


# ============================================================
# DATA INGESTION
# ============================================================

@router.post("/sync/index/{symbol}")
def sync_index(
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
def sync_stock(
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
def sync_stock_history(
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
def get_stock_history(
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
def get_breadth(
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


@router.get("/movers")
def get_movers(
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
            detail=(
                "Failed to fetch top movers: "
                f"{str(e)}"
            ),
        )


@router.get("/sectors")
def get_sectors(
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

