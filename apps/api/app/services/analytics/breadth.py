from sqlalchemy.orm import Session

from app.services.analytics.latest_prices import (
    get_latest_two_prices,
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

    for stock_id, prices in stocks.items():

        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if latest_close > previous_close:

            advancing.append(
                latest.symbol
            )

        elif latest_close < previous_close:

            declining.append(
                latest.symbol
            )

        else:

            unchanged.append(
                latest.symbol
            )

    total = (
        len(advancing)
        + len(declining)
        + len(unchanged)
    )

    if total > 0:

        advancing_percent = (
            len(advancing)
            / total
            * 100
        )

        declining_percent = (
            len(declining)
            / total
            * 100
        )

        unchanged_percent = (
            len(unchanged)
            / total
            * 100
        )

    else:

        advancing_percent = 0
        declining_percent = 0
        unchanged_percent = 0

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
            "percent": advancing_percent,
            "symbols": advancing,
        },

        "declining": {
            "count": len(declining),
            "percent": declining_percent,
            "symbols": declining,
        },

        "unchanged": {
            "count": len(unchanged),
            "percent": unchanged_percent,
            "symbols": unchanged,
        },

        "advance_decline_ratio":
            advance_decline_ratio,
    }