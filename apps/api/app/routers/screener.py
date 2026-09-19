from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.analytics.screener import screen_stocks


router = APIRouter(
    prefix="/api/screener",
    tags=["Screener"],
)


@router.get("")
def get_screener(
    search: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_change: float | None = Query(default=None),
    max_change: float | None = Query(default=None),
    min_volume: int | None = Query(default=None, ge=0),
    hide_no_trade: bool = Query(default=False),
    # Technical filters
    trend: str | None = Query(default=None),
    rsi_min: float | None = Query(default=None, ge=0, le=100),
    rsi_max: float | None = Query(default=None, ge=0, le=100),
    macd_signal: str | None = Query(default=None),
    price_vs_sma20: str | None = Query(default=None),
    price_vs_sma50: str | None = Query(default=None),
    price_vs_sma200: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return screen_stocks(
        db=db,
        search=search,
        sector=sector,
        min_price=min_price,
        max_price=max_price,
        min_change=min_change,
        max_change=max_change,
        min_volume=min_volume,
        hide_no_trade=hide_no_trade,
        trend=trend,
        rsi_min=rsi_min,
        rsi_max=rsi_max,
        macd_signal=macd_signal,
        price_vs_sma20=price_vs_sma20,
        price_vs_sma50=price_vs_sma50,
        price_vs_sma200=price_vs_sma200,
        limit=limit,
        offset=offset,
    )