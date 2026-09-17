from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.analytics.sector_rotation import (
    get_sector_rotation,
)


router = APIRouter(
    prefix="/api/sectors",
    tags=["Sectors"],
)


@router.get("/rotation")
def sector_rotation(
    db: Session = Depends(get_db),
):
    data = get_sector_rotation(db)

    return {
        "success": True,
        "data": data,
    }