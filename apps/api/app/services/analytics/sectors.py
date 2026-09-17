from sqlalchemy.orm import Session
from sqlalchemy import text


def get_sector_performance(db: Session):
    query = text("""
        SELECT
            s.sector,

            COUNT(*) AS stock_count,

            COUNT(*) FILTER (
                WHERE latest.close > previous.close
            ) AS advancing,

            COUNT(*) FILTER (
                WHERE latest.close < previous.close
            ) AS declining,

            COUNT(*) FILTER (
                WHERE latest.close = previous.close
            ) AS unchanged,

            AVG(
                CASE
                    WHEN previous.close IS NOT NULL
                         AND previous.close <> 0
                    THEN (
                        (latest.close - previous.close)
                        / previous.close
                    ) * 100
                END
            ) AS avg_change_percent,

            SUM(latest.volume) AS total_volume

        FROM stocks s

        JOIN LATERAL (
            SELECT
                close,
                volume
            FROM stock_prices sp
            WHERE sp.stock_id = s.id
            ORDER BY sp.timestamp DESC
            LIMIT 1
        ) latest ON TRUE

        JOIN LATERAL (
            SELECT
                close
            FROM stock_prices sp
            WHERE sp.stock_id = s.id
            ORDER BY sp.timestamp DESC
            OFFSET 1
            LIMIT 1
        ) previous ON TRUE

        WHERE s.sector IS NOT NULL
          AND TRIM(s.sector) <> ''

        GROUP BY s.sector
        ORDER BY avg_change_percent DESC
    """)

    rows = db.execute(query).mappings().all()

    result = []

    for row in rows:
        stock_count = int(row["stock_count"])
        advancing = int(row["advancing"] or 0)
        declining = int(row["declining"] or 0)
        unchanged = int(row["unchanged"] or 0)

        avg_change = (
            float(row["avg_change_percent"])
            if row["avg_change_percent"] is not None
            else 0
        )

        total_volume = int(row["total_volume"] or 0)

        if stock_count > 0:
            breadth_percent = (
                advancing / stock_count
            ) * 100
        else:
            breadth_percent = 0

        if avg_change > 0.5:
            momentum = "Positive"
        elif avg_change < -0.5:
            momentum = "Negative"
        else:
            momentum = "Neutral"

        result.append({
            "sector": row["sector"],
            "stock_count": stock_count,
            "advancing": advancing,
            "declining": declining,
            "unchanged": unchanged,
            "avg_change_percent": round(avg_change, 2),
            "breadth_percent": round(breadth_percent, 2),
            "total_volume": total_volume,
            "momentum": momentum,
        })

    return result