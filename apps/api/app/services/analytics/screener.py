from sqlalchemy.orm import Session
from sqlalchemy import text


def screen_stocks(
    db: Session,
    search: str | None = None,
    sector: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_change: float | None = None,
    max_change: float | None = None,
    min_volume: int | None = None,
    limit: int = 50,
    offset: int = 0,
):
    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)

    filters = []
    params = {
        "limit": limit,
        "offset": offset,
    }

    if search:
        filters.append(
            """
            (
                s.symbol ILIKE :search
                OR s.name ILIKE :search
            )
            """
        )
        params["search"] = f"%{search}%"

    if sector:
        filters.append("s.sector = :sector")
        params["sector"] = sector

    if min_price is not None:
        filters.append("latest.close >= :min_price")
        params["min_price"] = min_price

    if max_price is not None:
        filters.append("latest.close <= :max_price")
        params["max_price"] = max_price

    if min_change is not None:
        filters.append(
            """
            CASE
                WHEN previous.close IS NOT NULL
                     AND previous.close != 0
                THEN (
                    (latest.close - previous.close)
                    / previous.close
                ) * 100
                ELSE 0
            END >= :min_change
            """
        )
        params["min_change"] = min_change

    if max_change is not None:
        filters.append(
            """
            CASE
                WHEN previous.close IS NOT NULL
                     AND previous.close != 0
                THEN (
                    (latest.close - previous.close)
                    / previous.close
                ) * 100
                ELSE 0
            END <= :max_change
            """
        )
        params["max_change"] = max_change

    if min_volume is not None:
        filters.append("latest.volume >= :min_volume")
        params["min_volume"] = min_volume

    where_clause = ""

    if filters:
        where_clause = "WHERE " + " AND ".join(filters)

    query = text(
        f"""
        WITH latest_prices AS (
            SELECT DISTINCT ON (sp.stock_id)
                sp.stock_id,
                sp.timestamp,
                sp.close,
                sp.volume
            FROM stock_prices sp
            ORDER BY sp.stock_id, sp.timestamp DESC
        ),

        previous_prices AS (
            SELECT
                lp.stock_id,
                (
                    SELECT sp2.close
                    FROM stock_prices sp2
                    WHERE sp2.stock_id = lp.stock_id
                      AND sp2.timestamp < lp.timestamp
                    ORDER BY sp2.timestamp DESC
                    LIMIT 1
                ) AS close
            FROM latest_prices lp
        )

        SELECT
            s.symbol,
            s.name,
            s.sector,

            latest.close AS price,
            previous.close AS previous_close,

            CASE
                WHEN previous.close IS NOT NULL
                THEN latest.close - previous.close
                ELSE NULL
            END AS change,

            CASE
                WHEN previous.close IS NOT NULL
                     AND previous.close != 0
                THEN (
                    (latest.close - previous.close)
                    / previous.close
                ) * 100
                ELSE NULL
            END AS change_percent,

            latest.volume,
            latest.timestamp

        FROM stocks s

        JOIN latest_prices latest
            ON latest.stock_id = s.id

        LEFT JOIN previous_prices previous
            ON previous.stock_id = s.id

        {where_clause}

        ORDER BY s.symbol ASC

        LIMIT :limit
        OFFSET :offset
        """
    )

    count_query = text(
        f"""
        WITH latest_prices AS (
            SELECT DISTINCT ON (sp.stock_id)
                sp.stock_id,
                sp.timestamp,
                sp.close,
                sp.volume
            FROM stock_prices sp
            ORDER BY sp.stock_id, sp.timestamp DESC
        ),

        previous_prices AS (
            SELECT
                lp.stock_id,
                (
                    SELECT sp2.close
                    FROM stock_prices sp2
                    WHERE sp2.stock_id = lp.stock_id
                      AND sp2.timestamp < lp.timestamp
                    ORDER BY sp2.timestamp DESC
                    LIMIT 1
                ) AS close
            FROM latest_prices lp
        )

        SELECT COUNT(*)

        FROM stocks s

        JOIN latest_prices latest
            ON latest.stock_id = s.id

        LEFT JOIN previous_prices previous
            ON previous.stock_id = s.id

        {where_clause}
        """
    )

    total = db.execute(count_query, params).scalar() or 0

    rows = db.execute(query, params).mappings().all()

    data = []

    for row in rows:
        data.append(
            {
                "symbol": row["symbol"],
                "name": row["name"],
                "sector": row["sector"],
                "price": float(row["price"]) if row["price"] is not None else None,
                "previous_close": (
                    float(row["previous_close"])
                    if row["previous_close"] is not None
                    else None
                ),
                "change": (
                    float(row["change"])
                    if row["change"] is not None
                    else None
                ),
                "change_percent": (
                    float(row["change_percent"])
                    if row["change_percent"] is not None
                    else None
                ),
                "volume": int(row["volume"]) if row["volume"] is not None else 0,
                "timestamp": (
                    row["timestamp"].isoformat()
                    if row["timestamp"] is not None
                    else None
                ),
            }
        )

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