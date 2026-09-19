from sqlalchemy.orm import Session

from app.services.analytics.latest_prices import (
    get_latest_two_prices,
)
from app.services.analytics.trading_status import (
    classify_trading_status,
)


def get_market_breadth(db: Session):

    rows = get_latest_two_prices(db)

    stocks = {}

    for row in rows:

        stock_id = row.stock_id

        if stock_id not in stocks:
            stocks[stock_id] = []

        stocks[stock_id].append(row)

    advancing = []
    declining = []
    unchanged = []
    no_trading = []
    insufficient = []

    for stock_id, prices in stocks.items():

        if len(prices) < 1:
            continue

        latest = prices[0]

        previous_close = (
            float(prices[1].close)
            if len(prices) >= 2
            else None
        )

        status = classify_trading_status(
            price=(
                float(latest.close)
                if latest.close is not None
                else None
            ),
            volume=(
                int(latest.volume)
                if latest.volume is not None
                else 0
            ),
            previous_close=previous_close,
        )

        if status == "NO_VOLUME":

            no_trading.append(latest.symbol)
            continue

        if previous_close is None:

            insufficient.append(latest.symbol)
            continue

        latest_close = float(latest.close)

        if latest_close > previous_close:

            advancing.append(latest.symbol)

        elif latest_close < previous_close:

            declining.append(latest.symbol)

        else:

            unchanged.append(latest.symbol)

    total = (
        len(advancing)
        + len(declining)
        + len(unchanged)
        + len(no_trading)
        + len(insufficient)
    )

    def percent_of(size):
        return (
            size / total * 100
            if total > 0
            else 0
        )

    if len(declining) > 0:

        advance_decline_ratio = (
            len(advancing)
            / len(declining)
        )

    else:

        advance_decline_ratio = None

    return {
        "total": total,

        "advancing": {
            "count": len(advancing),
            "percent": percent_of(len(advancing)),
            "symbols": advancing,
        },

        "declining": {
            "count": len(declining),
            "percent": percent_of(len(declining)),
            "symbols": declining,
        },

        "unchanged": {
            "count": len(unchanged),
            "percent": percent_of(len(unchanged)),
            "symbols": unchanged,
        },

        "no_trading": {
            "count": len(no_trading),
            "percent": percent_of(len(no_trading)),
            "symbols": no_trading,
        },

        "insufficient": {
            "count": len(insufficient),
            "percent": percent_of(len(insufficient)),
            "symbols": insufficient,
        },

        "advance_decline_ratio":
            advance_decline_ratio,
    }