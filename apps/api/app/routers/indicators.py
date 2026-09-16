from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.analytics.indicators import get_stock_indicators


router = APIRouter(
    prefix="/api/indicators",
    tags=["Technical Indicators"],
)


@router.get("/{symbol}")
def get_indicators(
    symbol: str,
    db: Session = Depends(get_db),
):
    try:
        return get_stock_indicators(
            db=db,
            symbol=symbol,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate indicators: {exc}",
        )