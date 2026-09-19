import pandas as pd


def compute_benchmark_comparison(
    equity_curve,
    index_df: pd.DataFrame,
):
    """
    Compare strategy equity curve against a benchmark
    (IHSG) over the overlapping date range.

    Both series are re-based to 100 at the start of the
    overlap so they are directly comparable in % terms.
    """
    if not equity_curve:
        return None

    equity_df = pd.DataFrame(equity_curve)

    if "equity" not in equity_df.columns:
        return None

    index_df = index_df.copy()

    if "close" not in index_df.columns:
        return None

    equity_df["date"] = (
        pd.to_datetime(equity_df["timestamp"])
        .dt.strftime("%Y-%m-%d")
    )

    index_df["date"] = (
        pd.to_datetime(index_df["timestamp"])
        .dt.strftime("%Y-%m-%d")
    )

    merged = pd.merge(
        equity_df[["date", "equity"]],
        index_df[["date", "close"]],
        on="date",
        how="inner",
    )

    merged = (
        merged.dropna(subset=["equity", "close"])
        .sort_values("date")
        .reset_index(drop=True)
    )

    if len(merged) < 2:
        return None

    first_equity = float(merged["equity"].iloc[0])
    first_close = float(merged["close"].iloc[0])

    if first_equity <= 0 or first_close <= 0:
        return None

    merged["strategy_value"] = (
        merged["equity"] / first_equity * 100
    )

    merged["benchmark_value"] = (
        merged["close"] / first_close * 100
    )

    strategy_value = float(
        merged["strategy_value"].iloc[-1]
    )

    benchmark_value = float(
        merged["benchmark_value"].iloc[-1]
    )

    strategy_return = (
        (strategy_value - 100) / 100 * 100
    )

    benchmark_return = (
        (benchmark_value - 100) / 100 * 100
    )

    excess_return = (
        strategy_return - benchmark_return
    )

    # =========================================
    # BENCHMARK MAX DRAWDOWN
    # =========================================

    benchmark_values = (
        merged["benchmark_value"]
    )

    running_max = (
        benchmark_values.cummax()
    )

    drawdown = (
        benchmark_values - running_max
    ) / running_max * 100

    benchmark_max_drawdown = float(
        drawdown.min()
    )

    # =========================================
    # BENCHMARK VOLATILITY (annualized)
    # =========================================

    benchmark_daily_returns = (
        merged["close"].pct_change().dropna()
    )

    if (
        len(benchmark_daily_returns) > 1
        and benchmark_daily_returns.std() != 0
    ):

        benchmark_volatility = float(
            benchmark_daily_returns.std()
            * (252 ** 0.5)
            * 100
        )

    else:
        benchmark_volatility = None

    # =========================================
    # BETA vs BENCHMARK
    # =========================================

    strategy_daily_returns = (
        merged["equity"].pct_change().dropna()
    )

    index_daily_returns = (
        merged["close"].pct_change().dropna()
    )

    beta = None

    if (
        len(index_daily_returns) > 1
        and index_daily_returns.var() != 0
    ):

        beta = float(
            strategy_daily_returns.cov(
                index_daily_returns
            )
            / index_daily_returns.var()
        )

    curve = [
        {
            "timestamp": row["date"],
            "strategy": round(
                float(row["strategy_value"]),
                4,
            ),
            "benchmark": round(
                float(row["benchmark_value"]),
                4,
            ),
        }
        for _, row in merged.iterrows()
    ]

    return {
        "benchmark": "IHSG",
        "strategy_return_percent": round(
            strategy_return,
            4,
        ),
        "benchmark_return_percent": round(
            benchmark_return,
            4,
        ),
        "excess_return_percent": round(
            excess_return,
            4,
        ),
        "benchmark_max_drawdown_percent": round(
            benchmark_max_drawdown,
            4,
        ),
        "benchmark_volatility_percent": (
            benchmark_volatility
        ),
        "beta": beta,
        "data_points": len(merged),
        "curve": curve,
    }