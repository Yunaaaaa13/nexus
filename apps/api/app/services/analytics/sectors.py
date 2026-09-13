from sqlalchemy.orm import Session

from app.services.analytics.latest_prices import (
    get_latest_two_prices,
)


def get_sector_performance(db: Session):

    rows = get_latest_two_prices(db)

    stocks = {}

    for row in rows:

        stock_id = row.stock_id

        if stock_id not in stocks:
            stocks[stock_id] = []

        stocks[stock_id].append(row)

    sector_data = {}

    for stock_id, prices in stocks.items():

        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        if not latest.sector:
            continue

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if previous_close == 0:
            continue

        change_percent = (
            (
                latest_close
                - previous_close
            )
            / previous_close
            * 100
        )

        sector = latest.sector

        if sector not in sector_data:

            sector_data[sector] = {
                "sector": sector,
                "stock_count": 0,
                "total_change_percent": 0.0,
                "stocks": [],
            }

        sector_data[sector][
            "stock_count"
        ] += 1

        sector_data[sector][
            "total_change_percent"
        ] += change_percent

        sector_data[sector][
            "stocks"
        ].append(
            {
                "symbol": latest.symbol,
                "change_percent": change_percent,
            }
        )

    result = []

    for sector, data in sector_data.items():

        stock_count = data[
            "stock_count"
        ]

        average_change = (
            data["total_change_percent"]
            / stock_count
        )

        result.append(
            {
                "sector": sector,
                "stock_count": stock_count,
                "average_change_percent":
                    average_change,
                "stocks": data["stocks"],
            }
        )

    result.sort(
        key=lambda x:
            x["average_change_percent"],
        reverse=True,
    )

    return result