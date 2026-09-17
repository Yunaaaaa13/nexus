from sqlalchemy.orm import Session
from sqlalchemy import text


def get_sector_rotation(db: Session):
    query = text("""
        WITH stock_data AS (
            SELECT
                s.id AS stock_id,
                s.sector,

                latest.close AS latest_close,
                previous.close AS previous_close,
                twenty_day.close AS twenty_day_close

            FROM stocks s

            JOIN LATERAL (
                SELECT
                    close
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

            JOIN LATERAL (
                SELECT
                    close
                FROM stock_prices sp
                WHERE sp.stock_id = s.id
                ORDER BY sp.timestamp DESC
                OFFSET 20
                LIMIT 1
            ) twenty_day ON TRUE

            WHERE s.sector IS NOT NULL
              AND TRIM(s.sector) <> ''
        )

        SELECT
            sector,

            COUNT(*) AS stock_count,

            COUNT(*) FILTER (
                WHERE latest_close > previous_close
            ) AS advancing,

            COUNT(*) FILTER (
                WHERE latest_close < previous_close
            ) AS declining,

            COUNT(*) FILTER (
                WHERE latest_close = previous_close
            ) AS unchanged,

            AVG(
                CASE
                    WHEN previous_close IS NOT NULL
                         AND previous_close <> 0
                    THEN (
                        (latest_close - previous_close)
                        / previous_close
                    ) * 100
                END
            ) AS daily_change_percent,

            AVG(
                CASE
                    WHEN twenty_day_close IS NOT NULL
                         AND twenty_day_close <> 0
                    THEN (
                        (latest_close - twenty_day_close)
                        / twenty_day_close
                    ) * 100
                END
            ) AS performance_20d

        FROM stock_data

        GROUP BY sector
        ORDER BY performance_20d DESC
    """)

    rows = db.execute(query).mappings().all()

    if not rows:
        return []

    sectors = []

    for row in rows:
        stock_count = int(row["stock_count"] or 0)
        advancing = int(row["advancing"] or 0)
        declining = int(row["declining"] or 0)
        unchanged = int(row["unchanged"] or 0)

        daily_change = (
            float(row["daily_change_percent"])
            if row["daily_change_percent"] is not None
            else 0.0
        )

        performance_20d = (
            float(row["performance_20d"])
            if row["performance_20d"] is not None
            else 0.0
        )

        breadth_percent = (
            (advancing / stock_count) * 100
            if stock_count > 0
            else 0.0
        )

        sectors.append({
            "sector": row["sector"],
            "stock_count": stock_count,
            "advancing": advancing,
            "declining": declining,
            "unchanged": unchanged,
            "daily_change_percent": round(daily_change, 2),
            "performance_20d": round(performance_20d, 2),
            "breadth_percent": round(breadth_percent, 2),
        })

    # Median digunakan sebagai baseline relatif antar sektor.
    performance_values = [
        item["performance_20d"]
        for item in sectors
    ]

    breadth_values = [
        item["breadth_percent"]
        for item in sectors
    ]

    performance_values.sort()
    breadth_values.sort()

    def median(values):
        n = len(values)

        if n == 0:
            return 0

        middle = n // 2

        if n % 2 == 0:
            return (
                values[middle - 1] +
                values[middle]
            ) / 2

        return values[middle]

    performance_median = median(performance_values)
    breadth_median = median(breadth_values)

    for item in sectors:
        performance_above = (
            item["performance_20d"] >= performance_median
        )

        breadth_above = (
            item["breadth_percent"] >= breadth_median
        )

        if performance_above and breadth_above:
            rotation_state = "Leading"

        elif performance_above and not breadth_above:
            rotation_state = "Improving"

        elif not performance_above and not breadth_above:
            rotation_state = "Lagging"

        else:
            rotation_state = "Weakening"

        item["rotation_state"] = rotation_state

    return {
        "sectors": sectors,
        "benchmarks": {
            "performance_20d_median": round(
                performance_median,
                2
            ),
            "breadth_median": round(
                breadth_median,
                2
            ),
        },
    }