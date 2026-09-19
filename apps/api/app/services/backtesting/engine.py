import pandas as pd


def run_backtest(
    df: pd.DataFrame,
    initial_capital: float = 100_000_000,
    strategy: str = "dual_sma",
    buy_fee_percent: float = 0.0,
    sell_fee_percent: float = 0.0,
    slippage_percent: float = 0.0,
):
    if df.empty:
        raise ValueError(
            "No historical data available"
        )

    if initial_capital <= 0:
        raise ValueError(
            "Initial capital must be greater than zero"
        )

    if buy_fee_percent < 0:
        raise ValueError(
            "Buy fee cannot be negative"
        )

    if sell_fee_percent < 0:
        raise ValueError(
            "Sell fee cannot be negative"
        )

    if slippage_percent < 0:
        raise ValueError(
            "Slippage cannot be negative"
        )

    from app.services.backtesting.strategies import (
        apply_strategy,
    )

    data = apply_strategy(
        df,
        strategy,
    )

    capital = float(initial_capital)
    cash = float(initial_capital)

    shares = 0
    entry_price = None
    entry_date = None

    trades = []
    equity_curve = []

    buy_fee_rate = buy_fee_percent / 100
    sell_fee_rate = sell_fee_percent / 100
    slippage_rate = slippage_percent / 100

    for _, row in data.iterrows():

        price = float(row["close"])
        timestamp = row["timestamp"]

        signal = row["signal"]

        # =========================================
        # BUY
        # =========================================

        if signal == 1 and shares == 0:

            execution_price = (
                price * (1 + slippage_rate)
            )

            total_cost_per_share = (
                execution_price
                * (1 + buy_fee_rate)
            )

            shares = int(
                cash // total_cost_per_share
            )

            if shares > 0:

                gross_cost = (
                    shares
                    * execution_price
                )

                fee = (
                    gross_cost
                    * buy_fee_rate
                )

                total_cost = (
                    gross_cost + fee
                )

                cash -= total_cost

                entry_price = (
                    execution_price
                )

                entry_date = timestamp

                trades.append({
                    "type": "BUY",
                    "timestamp": timestamp.isoformat(),
                    "price": execution_price,
                    "shares": shares,
                    "fee": fee,
                })

        # =========================================
        # SELL
        # =========================================

        elif signal == -1 and shares > 0:

            execution_price = (
                price * (1 - slippage_rate)
            )

            gross_proceeds = (
                shares
                * execution_price
            )

            fee = (
                gross_proceeds
                * sell_fee_rate
            )

            net_proceeds = (
                gross_proceeds - fee
            )

            cash += net_proceeds

            pnl = (
                net_proceeds
                - (
                    shares
                    * entry_price
                )
            )

            return_percent = (
                pnl
                / (
                    shares
                    * entry_price
                )
            ) * 100

            trades.append({
                "type": "SELL",
                "timestamp": timestamp.isoformat(),
                "price": execution_price,
                "shares": shares,
                "entry_price": entry_price,
                "entry_date": (
                    entry_date.isoformat()
                    if entry_date is not None
                    else None
                ),
                "pnl": pnl,
                "return_percent": return_percent,
                "fee": fee,
            })

            shares = 0
            entry_price = None
            entry_date = None

        # =========================================
        # EQUITY
        # =========================================

        market_value = (
            cash
            + shares * price
        )

        equity_curve.append({
            "timestamp": timestamp.isoformat(),
            "equity": market_value,
        })

    # =========================================
    # FORCE CLOSE
    # =========================================

    if shares > 0:

        last_row = data.iloc[-1]

        price = float(
            last_row["close"]
        )

        execution_price = (
            price * (1 - slippage_rate)
        )

        gross_proceeds = (
            shares
            * execution_price
        )

        fee = (
            gross_proceeds
            * sell_fee_rate
        )

        net_proceeds = (
            gross_proceeds - fee
        )

        cash += net_proceeds

        pnl = (
            net_proceeds
            - (
                shares
                * entry_price
            )
        )

        return_percent = (
            pnl
            / (
                shares
                * entry_price
            )
        ) * 100

        trades.append({
            "type": "SELL",
            "timestamp": last_row["timestamp"].isoformat(),
            "price": execution_price,
            "shares": shares,
            "entry_price": entry_price,
            "entry_date": (
                entry_date.isoformat()
                if entry_date is not None
                else None
            ),
            "pnl": pnl,
            "return_percent": return_percent,
            "fee": fee,
            "forced_exit": True,
        })

    final_capital = cash

    # =========================================
    # TOTAL RETURN
    # =========================================

    total_return = (
        (
            final_capital
            - initial_capital
        )
        / initial_capital
    ) * 100

    # =========================================
    # EQUITY METRICS
    # =========================================

    equity_df = pd.DataFrame(
        equity_curve
    )

    max_drawdown = 0.0

    if not equity_df.empty:

        equity = equity_df["equity"]

        running_max = (
            equity.cummax()
        )

        drawdown = (
            equity - running_max
        ) / running_max * 100

        max_drawdown = float(
            drawdown.min()
        )

    # =========================================
    # TRADE METRICS
    # =========================================

    completed_trades = [
        trade
        for trade in trades
        if trade["type"] == "SELL"
        and "pnl" in trade
    ]

    winning_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] > 0
    ]

    losing_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] < 0
    ]

    trade_count = len(
        completed_trades
    )

    win_rate = (
        len(winning_trades)
        / trade_count
        * 100
        if trade_count > 0
        else 0
    )

    gross_profit = sum(
        trade["pnl"]
        for trade in winning_trades
    )

    gross_loss = abs(
        sum(
            trade["pnl"]
            for trade in losing_trades
        )
    )

    profit_factor = (
        gross_profit / gross_loss
        if gross_loss > 0
        else None
    )

    # =========================================
    # CUMULATIVE FEES
    # =========================================

    total_fees = sum(
        trade.get("fee", 0)
        for trade in trades
    )

    # =========================================
    # CAGR
    # =========================================

    if len(data) >= 2:

        first_date = data.iloc[0]["timestamp"]
        last_date = data.iloc[-1]["timestamp"]

        days = (
            last_date - first_date
        ).days

        years = days / 365.25

        if years > 0 and final_capital > 0:

            cagr = (
                (
                    final_capital
                    / initial_capital
                )
                ** (1 / years)
                - 1
            ) * 100

        else:
            cagr = 0.0

    else:
        cagr = 0.0

    # =========================================
    # SHARPE RATIO
    # =========================================

    sharpe_ratio = None

    if not equity_df.empty:

        equity_series = (
            equity_df["equity"]
        )

        daily_returns = (
            equity_series
            .pct_change()
            .dropna()
        )

        if (
            len(daily_returns) > 1
            and daily_returns.std() != 0
        ):

            sharpe_ratio = (
                daily_returns.mean()
                / daily_returns.std()
            ) * (252 ** 0.5)

    return {
        "initial_capital": initial_capital,
        "final_capital": final_capital,

        "total_return_percent": total_return,

        "cagr_percent": cagr,

        "max_drawdown_percent": max_drawdown,

        "trade_count": trade_count,

        "winning_trades": len(
            winning_trades
        ),

        "losing_trades": len(
            losing_trades
        ),

        "win_rate_percent": win_rate,

        "profit_factor": profit_factor,

        "sharpe_ratio": sharpe_ratio,

        "total_fees": total_fees,

        "buy_fee_percent": buy_fee_percent,

        "sell_fee_percent": sell_fee_percent,

        "slippage_percent": slippage_percent,

        "data_points": len(data),

        "start_date": (
            data.iloc[0]["timestamp"].isoformat()
            if len(data)
            else None
        ),

        "end_date": (
            data.iloc[-1]["timestamp"].isoformat()
            if len(data)
            else None
        ),

        "trades": trades,

        "equity_curve": equity_curve,
    }