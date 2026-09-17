from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.analytics.sectors import get_sector_performance


router = APIRouter(
    prefix="/api/sectors",
    tags=["Sectors"],
)


@router.get("")
def sector_performance(
    db: Session = Depends(get_db),
):
    data = get_sector_performance(db)

    return {
        "success": True,
        "data": data,
        "count": len(data),
    }