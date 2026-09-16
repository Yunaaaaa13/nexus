import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session


def calculate_signals(
    price: float,
    sma20: float | None,
    sma50: float | None,
    sma200: float | None,
    rsi14: float | None,
    macd: float | None,
    macd_signal: float | None,
):
    signals = {
        "trend": "Insufficient Data",
        "rsi": "Insufficient Data",
        "macd": "Insufficient Data",
        "overall": "Neutral",
    }

    # =========================================================
    # TREND SIGNAL
    # =========================================================

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
            signals["trend"] = "Bullish"

        elif (
            price < sma20
            and sma20 < sma50
            and sma50 < sma200
        ):
            signals["trend"] = "Bearish"

        else:
            signals["trend"] = "Neutral"

    # =========================================================
    # RSI SIGNAL
    # =========================================================

    if rsi14 is not None:

        if rsi14 >= 70:
            signals["rsi"] = "Overbought"

        elif rsi14 <= 30:
            signals["rsi"] = "Oversold"

        else:
            signals["rsi"] = "Neutral"

    # =========================================================
    # MACD SIGNAL
    # =========================================================

    if (
        macd is not None
        and macd_signal is not None
    ):
        if macd > macd_signal:
            signals["macd"] = "Bullish"

        elif macd < macd_signal:
            signals["macd"] = "Bearish"

        else:
            signals["macd"] = "Neutral"

    # =========================================================
    # OVERALL SIGNAL
    # =========================================================

    bullish_points = 0
    bearish_points = 0

    # Trend
    if signals["trend"] == "Bullish":
        bullish_points += 1

    elif signals["trend"] == "Bearish":
        bearish_points += 1

    # RSI
    #
    # Oversold tidak otomatis bullish kuat.
    # Untuk scoring sederhana kita hanya menggunakan
    # kondisi ekstrem sebagai contextual signal.
    if signals["rsi"] == "Oversold":
        bullish_points += 1

    elif signals["rsi"] == "Overbought":
        bearish_points += 1

    # MACD
    if signals["macd"] == "Bullish":
        bullish_points += 1

    elif signals["macd"] == "Bearish":
        bearish_points += 1

    if bullish_points > bearish_points:
        signals["overall"] = "Bullish"

    elif bearish_points > bullish_points:
        signals["overall"] = "Bearish"

    else:
        signals["overall"] = "Neutral"

    return signals


def get_stock_indicators(
    db: Session,
    symbol: str,
    period: int = 200,
):
    symbol = symbol.upper().strip()

    if not symbol:
        raise ValueError("Symbol is required")

    # Ambil historical price dari PostgreSQL.
    # Kita mengambil sedikit lebih banyak data untuk memastikan
    # indikator seperti SMA200 dapat dihitung dengan benar.
    query = text(
        """
        SELECT
            sp.timestamp,
            sp.open,
            sp.high,
            sp.low,
            sp.close,
            sp.volume
        FROM stock_prices sp
        JOIN stocks s
            ON s.id = sp.stock_id
        WHERE s.symbol = :symbol
        ORDER BY sp.timestamp ASC
        """
    )

    rows = db.execute(
        query,
        {"symbol": symbol},
    ).mappings().all()

    if not rows:
        raise ValueError(
            f"No historical price data found for {symbol}"
        )

    df = pd.DataFrame(rows)

    # Pastikan numeric
    numeric_columns = [
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    df = df.dropna(
        subset=["close"]
    ).copy()

    if df.empty:
        raise ValueError(
            f"No valid price data found for {symbol}"
        )

    # =========================================================
    # MOVING AVERAGES
    # =========================================================

    # Simple Moving Average
    df["sma20"] = (
        df["close"]
        .rolling(window=20)
        .mean()
    )

    df["sma50"] = (
        df["close"]
        .rolling(window=50)
        .mean()
    )

    df["sma200"] = (
        df["close"]
        .rolling(window=200)
        .mean()
    )

    # Exponential Moving Average
    df["ema20"] = (
        df["close"]
        .ewm(
            span=20,
            adjust=False,
        )
        .mean()
    )

    df["ema50"] = (
        df["close"]
        .ewm(
            span=50,
            adjust=False,
        )
        .mean()
    )

    # =========================================================
    # RSI 14
    # =========================================================

    delta = df["close"].diff()

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

    df["rsi14"] = 100 - (
        100 / (1 + rs)
    )

    # Kondisi khusus ketika average loss = 0
    df.loc[
        (average_loss == 0) &
        (average_gain > 0),
        "rsi14"
    ] = 100

    # =========================================================
    # MACD
    # =========================================================

    ema12 = (
        df["close"]
        .ewm(
            span=12,
            adjust=False,
        )
        .mean()
    )

    ema26 = (
        df["close"]
        .ewm(
            span=26,
            adjust=False,
        )
        .mean()
    )

    df["macd"] = ema12 - ema26

    df["macd_signal"] = (
        df["macd"]
        .ewm(
            span=9,
            adjust=False,
        )
        .mean()
    )

    df["macd_histogram"] = (
        df["macd"]
        - df["macd_signal"]
    )

    # =========================================================
    # VOLATILITY
    # =========================================================

    daily_return = (
        df["close"]
        .pct_change()
    )

    # 20-day annualized historical volatility
    df["volatility20"] = (
        daily_return
        .rolling(window=20)
        .std()
        * (252 ** 0.5)
        * 100
    )

    # =========================================================
    # TREND
    # =========================================================

    latest = df.iloc[-1]

    price = float(latest["close"])

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

    # =========================================================
    # LATEST INDICATOR VALUES
    # =========================================================

    def clean_value(value):
        if pd.isna(value):
            return None

        return float(value)

    signals = calculate_signals(
        price=price,
        sma20=sma20,
        sma50=sma50,
        sma200=sma200,
        rsi14=clean_value(latest["rsi14"]),
        macd=clean_value(latest["macd"]),
        macd_signal=clean_value(latest["macd_signal"]),
    )

    return {
        "success": True,
        "symbol": symbol,
        "data": {
            "timestamp": (
                latest["timestamp"].isoformat()
                if hasattr(
                    latest["timestamp"],
                    "isoformat",
                )
                else str(latest["timestamp"])
            ),

            "price": clean_value(
                latest["close"]
            ),

            "sma20": clean_value(
                latest["sma20"]
            ),

            "sma50": clean_value(
                latest["sma50"]
            ),

            "sma200": clean_value(
                latest["sma200"]
            ),

            "ema20": clean_value(
                latest["ema20"]
            ),

            "ema50": clean_value(
                latest["ema50"]
            ),

            "rsi14": clean_value(
                latest["rsi14"]
            ),

            "macd": clean_value(
                latest["macd"]
            ),

            "macd_signal": clean_value(
                latest["macd_signal"]
            ),

            "macd_histogram": clean_value(
                latest["macd_histogram"]
            ),

            "volatility20": clean_value(
                latest["volatility20"]
            ),

            "trend": trend,

            "signals": signals,
        },

        "metadata": {
            "records": len(df),
            "source": "PostgreSQL",
            "calculation": "NEXUS Technical Analysis Engine",
        },
    }