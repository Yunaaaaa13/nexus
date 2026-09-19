import pandas as pd


def add_indicators(df: pd.DataFrame):
    data = df.copy()

    close = data["close"]

    # SMA
    data["sma20"] = close.rolling(20).mean()
    data["sma50"] = close.rolling(50).mean()

    # RSI
    delta = close.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(
        alpha=1 / 14,
        adjust=False,
    ).mean()

    avg_loss = loss.ewm(
        alpha=1 / 14,
        adjust=False,
    ).mean()

    rs = avg_gain / avg_loss

    data["rsi14"] = 100 - (
        100 / (1 + rs)
    )

    # Bollinger Bands
    data["bb_middle"] = (
        close.rolling(20).mean()
    )

    data["bb_std"] = (
        close.rolling(20).std()
    )

    data["bb_upper"] = (
        data["bb_middle"]
        + 2 * data["bb_std"]
    )

    data["bb_lower"] = (
        data["bb_middle"]
        - 2 * data["bb_std"]
    )

    return data


def dual_sma_strategy(df: pd.DataFrame):
    data = df.copy()

    data["signal"] = 0

    data.loc[
        data["sma20"] > data["sma50"],
        "signal"
    ] = 1

    data.loc[
        data["sma20"] < data["sma50"],
        "signal"
    ] = -1

    return data


def rsi_momentum_strategy(df: pd.DataFrame):
    data = df.copy()

    data["signal"] = 0

    # Entry ketika RSI masuk area momentum positif
    data.loc[
        (data["rsi14"] > 50)
        & (data["rsi14"] < 70),
        "signal"
    ] = 1

    # Exit ketika momentum melemah
    data.loc[
        data["rsi14"] < 45,
        "signal"
    ] = -1

    return data


def bollinger_mean_reversion_strategy(
    df: pd.DataFrame,
):
    data = df.copy()

    data["signal"] = 0

    # BUY ketika harga berada di bawah lower band
    data.loc[
        data["close"] < data["bb_lower"],
        "signal"
    ] = 1

    # SELL ketika harga kembali ke middle band
    data.loc[
        data["close"] >= data["bb_middle"],
        "signal"
    ] = -1

    return data


def apply_strategy(
    df: pd.DataFrame,
    strategy: str,
):
    data = add_indicators(df)

    strategy = strategy.lower().strip()

    if strategy in [
        "dual_sma",
        "dual sma",
    ]:
        return dual_sma_strategy(data)

    if strategy in [
        "rsi_momentum",
        "rsi momentum",
    ]:
        return rsi_momentum_strategy(data)

    if strategy in [
        "bollinger",
        "bollinger_mean_reversion",
        "bollinger mean reversion",
    ]:
        return bollinger_mean_reversion_strategy(
            data
        )

    raise ValueError(
        f"Unknown strategy: {strategy}"
    )