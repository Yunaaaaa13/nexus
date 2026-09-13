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
        limit=limit,
        offset=offset,
    )