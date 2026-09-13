from sqlalchemy.orm import Session

from app.services.analytics.latest_prices import (
    get_latest_two_prices,
)


def get_top_movers(
    db: Session,
    limit: int = 5,
):
    rows = get_latest_two_prices(db)

    stocks = {}

    for row in rows:

        stock_id = row.stock_id

        if stock_id not in stocks:
            stocks[stock_id] = []

        stocks[stock_id].append(row)

    movers = []

    for stock_id, prices in stocks.items():

        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if previous_close == 0:
            continue

        change = (
            latest_close
            - previous_close
        )

        change_percent = (
            change
            / previous_close
            * 100
        )

        movers.append(
            {
                "symbol": latest.symbol,
                "name": latest.name,
                "sector": latest.sector,
                "price": latest_close,
                "previous_close": previous_close,
                "change": change,
                "change_percent": change_percent,
                "volume": latest.volume,
                "timestamp": latest.timestamp.isoformat(),
            }
        )

    gainers = sorted(
        [
            item
            for item in movers
            if item["change_percent"] > 0
        ],
        key=lambda x: x["change_percent"],
        reverse=True,
    )[:limit]

    losers = sorted(
        [
            item
            for item in movers
            if item["change_percent"] < 0
        ],
        key=lambda x: x["change_percent"],
    )[:limit]

    return {
        "gainers": gainers,
        "losers": losers,
    }