import pandas as pd

from sqlalchemy.orm import Session
from sqlalchemy import text


def calculate_screener_indicators(
    db: Session,
):
    query = text(
        """
        SELECT
            s.symbol,
            sp.timestamp,
            sp.close
        FROM stock_prices sp
        JOIN stocks s
            ON s.id = sp.stock_id
        ORDER BY s.symbol, sp.timestamp ASC
        """
    )

    rows = db.execute(query).mappings().all()

    if not rows:
        return {}

    df = pd.DataFrame(rows)

    df["close"] = pd.to_numeric(
        df["close"],
        errors="coerce",
    )

    df = df.dropna(
        subset=["close"]
    ).copy()

    if df.empty:
        return {}

    results = {}

    for symbol, group in df.groupby("symbol"):
        stock_df = group.copy()

        close = stock_df["close"]

        # =====================================================
        # MOVING AVERAGES
        # =====================================================

        stock_df["sma20"] = (
            close
            .rolling(window=20)
            .mean()
        )

        stock_df["sma50"] = (
            close
            .rolling(window=50)
            .mean()
        )

        stock_df["sma200"] = (
            close
            .rolling(window=200)
            .mean()
        )

        # =====================================================
        # RSI 14
        # =====================================================

        delta = close.diff()

        gain = delta.clip(
            lower=0
        )

        loss = -delta.clip(
            upper=0
        )

        average_gain = (
            gain
            .ewm(
                alpha=1 / 14,
                adjust=False,
            )
            .mean()
        )

        average_loss = (
            loss
            .ewm(
                alpha=1 / 14,
                adjust=False,
            )
            .mean()
        )

        rs = average_gain / average_loss

        stock_df["rsi14"] = (
            100
            - (
                100
                / (1 + rs)
            )
        )

        stock_df.loc[
            (average_loss == 0)
            & (average_gain > 0),
            "rsi14",
        ] = 100

        # =====================================================
        # MACD
        # =====================================================

        ema12 = (
            close
            .ewm(
                span=12,
                adjust=False,
            )
            .mean()
        )

        ema26 = (
            close
            .ewm(
                span=26,
                adjust=False,
            )
            .mean()
        )

        stock_df["macd"] = (
            ema12 - ema26
        )

        stock_df["macd_signal"] = (
            stock_df["macd"]
            .ewm(
                span=9,
                adjust=False,
            )
            .mean()
        )

        stock_df["macd_histogram"] = (
            stock_df["macd"]
            - stock_df["macd_signal"]
        )

        # =====================================================
        # VOLATILITY
        # =====================================================

        daily_return = (
            close.pct_change()
        )

        stock_df["volatility20"] = (
            daily_return
            .rolling(window=20)
            .std()
            * (252 ** 0.5)
            * 100
        )

        # =====================================================
        # LATEST DATA
        # =====================================================

        latest = stock_df.iloc[-1]

        price = float(
            latest["close"]
        )

        sma20 = (
            float(latest["sma20"])
            if pd.notna(latest["sma20"])
            else None
        )

        sma50 = (
            float(latest["sma50"])
            if pd.notna(latest["sma50"])
            else None
        )

        sma200 = (
            float(latest["sma200"])
            if pd.notna(latest["sma200"])
            else None
        )

        rsi14 = (
            float(latest["rsi14"])
            if pd.notna(latest["rsi14"])
            else None
        )

        macd = (
            float(latest["macd"])
            if pd.notna(latest["macd"])
            else None
        )

        macd_signal = (
            float(latest["macd_signal"])
            if pd.notna(latest["macd_signal"])
            else None
        )

        macd_histogram = (
            float(latest["macd_histogram"])
            if pd.notna(latest["macd_histogram"])
            else None
        )

        volatility20 = (
            float(latest["volatility20"])
            if pd.notna(latest["volatility20"])
            else None
        )

        # =====================================================
        # TREND
        # =====================================================

        if (
            sma20 is not None
            and sma50 is not None
            and sma200 is not None
        ):
            if (
                price > sma20
                and sma20 > sma50
                and sma50 > sma200
            ):
                trend = "Bullish"

            elif (
                price < sma20
                and sma20 < sma50
                and sma50 < sma200
            ):
                trend = "Bearish"

            else:
                trend = "Neutral"

        else:
            trend = "Insufficient Data"

        results[symbol] = {
            "sma20": sma20,
            "sma50": sma50,
            "sma200": sma200,
            "rsi14": rsi14,
            "macd": macd,
            "macd_signal": macd_signal,
            "macd_histogram": macd_histogram,
            "volatility20": volatility20,
            "trend": trend,
        }

    return results


def screen_stocks(
    db: Session,
    search: str | None = None,
    sector: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_change: float | None = None,
    max_change: float | None = None,
    min_volume: int | None = None,
    # Technical filters
    trend: str | None = None,
    rsi_min: float | None = None,
    rsi_max: float | None = None,
    macd_signal: str | None = None,
    price_vs_sma20: str | None = None,
    price_vs_sma50: str | None = None,
    price_vs_sma200: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)

    technical_data = calculate_screener_indicators(db)

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