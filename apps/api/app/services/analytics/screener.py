import time

import pandas as pd

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.services.analytics.trading_status import (
    classify_trading_status,
)


_technical_cache: dict = {}
_technical_cache_time: float = 0.0
_TECHNICAL_CACHE_TTL = 300


def calculate_screener_indicators(
    db: Session,
):
    global _technical_cache, _technical_cache_time

    now = time.time()

    if (
        _technical_cache
        and (now - _technical_cache_time) < _TECHNICAL_CACHE_TTL
    ):
        return _technical_cache
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
            "price": price,
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

    _technical_cache = results
    _technical_cache_time = time.time()

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
    hide_no_trade: bool = False,
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

    # =========================================================
    # TECHNICAL FILTERS
    # =========================================================

    technical_symbols = set(technical_data.keys())

    if trend:
        trend = trend.strip().title()

        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if technical_data[symbol]["trend"] == trend
        }

    if rsi_min is not None:
        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if technical_data[symbol]["rsi14"] is not None
            and technical_data[symbol]["rsi14"] >= rsi_min
        }

    if rsi_max is not None:
        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if technical_data[symbol]["rsi14"] is not None
            and technical_data[symbol]["rsi14"] <= rsi_max
        }

    if macd_signal:
        macd_signal = macd_signal.strip().title()

        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if (
                (
                    macd_signal == "Bullish"
                    and technical_data[symbol]["macd"] is not None
                    and technical_data[symbol]["macd_signal"] is not None
                    and technical_data[symbol]["macd"]
                    > technical_data[symbol]["macd_signal"]
                )
                or
                (
                    macd_signal == "Bearish"
                    and technical_data[symbol]["macd"] is not None
                    and technical_data[symbol]["macd_signal"] is not None
                    and technical_data[symbol]["macd"]
                    < technical_data[symbol]["macd_signal"]
                )
                or
                (
                    macd_signal == "Neutral"
                    and technical_data[symbol]["macd"] is not None
                    and technical_data[symbol]["macd_signal"] is not None
                    and technical_data[symbol]["macd"]
                    == technical_data[symbol]["macd_signal"]
                )
            )
        }

    def check_price_vs_sma(symbol, sma_key, condition):
        value = technical_data[symbol].get(sma_key)

        if value is None:
            return False

        price = technical_data[symbol].get("price")

        if price is None:
            return False

        if condition == "above":
            return price > value

        if condition == "below":
            return price < value

        return True

    if price_vs_sma20:
        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if check_price_vs_sma(
                symbol,
                "sma20",
                price_vs_sma20.lower(),
            )
        }

    if price_vs_sma50:
        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if check_price_vs_sma(
                symbol,
                "sma50",
                price_vs_sma50.lower(),
            )
        }

    if price_vs_sma200:
        technical_symbols = {
            symbol
            for symbol in technical_symbols
            if check_price_vs_sma(
                symbol,
                "sma200",
                price_vs_sma200.lower(),
            )
        }

    if technical_symbols != set(technical_data.keys()):
        if not technical_symbols:
            return {
                "success": True,
                "data": [],
                "pagination": {
                    "total": 0,
                    "limit": limit,
                    "offset": offset,
                    "returned": 0,
                },
            }

        filters.append(
            "s.symbol = ANY(:technical_symbols)"
        )

        params["technical_symbols"] = list(
            technical_symbols
        )

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

    if hide_no_trade:
        filters.append("latest.volume > 0")

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
        ),

        last_traded AS (
            SELECT DISTINCT ON (sp.stock_id)
                sp.stock_id,
                sp.timestamp
            FROM stock_prices sp
            WHERE sp.volume > 0
            ORDER BY sp.stock_id, sp.timestamp DESC
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
            latest.timestamp,
            last_traded.timestamp AS last_volume_timestamp

        FROM stocks s

        JOIN latest_prices latest
            ON latest.stock_id = s.id

        LEFT JOIN previous_prices previous
            ON previous.stock_id = s.id

        LEFT JOIN last_traded
            ON last_traded.stock_id = s.id

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
        ),

        last_traded AS (
            SELECT DISTINCT ON (sp.stock_id)
                sp.stock_id,
                sp.timestamp
            FROM stock_prices sp
            WHERE sp.volume > 0
            ORDER BY sp.stock_id, sp.timestamp DESC
        )

        SELECT COUNT(*)

        FROM stocks s

        JOIN latest_prices latest
            ON latest.stock_id = s.id

        LEFT JOIN previous_prices previous
            ON previous.stock_id = s.id

        LEFT JOIN last_traded
            ON last_traded.stock_id = s.id

        {where_clause}
        """
    )

    total = db.execute(count_query, params).scalar() or 0

    rows = db.execute(query, params).mappings().all()

    data = []

    for row in rows:
        technical = technical_data.get(
            row["symbol"],
            {}
        )

        price = (
            float(row["price"])
            if row["price"] is not None
            else None
        )

        previous_close = (
            float(row["previous_close"])
            if row["previous_close"] is not None
            else None
        )

        change = (
            float(row["change"])
            if row["change"] is not None
            else None
        )

        change_percent = (
            float(row["change_percent"])
            if row["change_percent"] is not None
            else None
        )

        volume = (
            int(row["volume"])
            if row["volume"] is not None
            else 0
        )

        data.append(
            {
                "symbol": row["symbol"],
                "name": row["name"],
                "sector": row["sector"],
                "price": price,
                "previous_close": previous_close,
                "change": change,
                "change_percent": change_percent,
                "volume": volume,
                "trading_status": classify_trading_status(
                    price=price,
                    volume=volume,
                    previous_close=previous_close,
                ),
                "timestamp": (
                    row["timestamp"].isoformat()
                    if row["timestamp"] is not None
                    else None
                ),
                "last_volume_timestamp": (
                    row["last_volume_timestamp"].isoformat()
                    if row["last_volume_timestamp"] is not None
                    else None
                ),
                # Technical Analysis
                "rsi14": technical.get("rsi14"),
                "sma20": technical.get("sma20"),
                "sma50": technical.get("sma50"),
                "sma200": technical.get("sma200"),
                "macd": technical.get("macd"),
                "macd_signal": technical.get("macd_signal"),
                "macd_histogram": technical.get(
                    "macd_histogram"
                ),
                "volatility20": technical.get(
                    "volatility20"
                ),
                "trend": technical.get("trend"),
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