from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db


router = APIRouter(
    prefix="/api/stocks",
    tags=["Stocks"],
)


@router.get("")
def list_stocks(
    search: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    filters = []
    params = {}

    if search:
        search = search.strip()

        if search:
            filters.append(
                """
                (
                    symbol ILIKE :search
                    OR name ILIKE :search
                )
                """
            )
            params["search"] = f"%{search}%"

    if sector:
        filters.append("sector ILIKE :sector")
        params["sector"] = f"%{sector}%"

    where_clause = (
        "WHERE " + " AND ".join(filters)
        if filters
        else ""
    )

    count_query = text(
        f"""
        SELECT COUNT(*)
        FROM stocks
        {where_clause}
        """
    )

    total = db.execute(
        count_query,
        params,
    ).scalar() or 0

    query = text(
        f"""
        SELECT
            symbol,
            name,
            sector
        FROM stocks
        {where_clause}
        ORDER BY symbol ASC
        LIMIT :limit
        OFFSET :offset
        """
    )

    rows = db.execute(
        query,
        {
            **params,
            "limit": limit,
            "offset": offset,
        },
    ).mappings().all()

    return {
        "success": True,
        "data": [dict(row) for row in rows],
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "returned": len(rows),
        },
    }