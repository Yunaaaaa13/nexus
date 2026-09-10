from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.stock_price import StockPrice


def get_sector_performance(db: Session):
    stocks = db.execute(
        select(Stock)
        .where(Stock.sector.is_not(None))
        .order_by(Stock.symbol)
    ).scalars().all()

    sector_data = {}

    for stock in stocks:
        prices = db.execute(
            select(StockPrice)
            .where(
                StockPrice.stock_id == stock.id
            )
            .order_by(
                StockPrice.timestamp.desc()
            )
            .limit(2)
        ).scalars().all()

        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if previous_close == 0:
            continue

        change_percent = (
            (latest_close - previous_close)
            / previous_close
        ) * 100

        sector = stock.sector

        if sector not in sector_data:
            sector_data[sector] = {
                "sector": sector,
                "stock_count": 0,
                "total_change_percent": 0.0,
                "stocks": [],
            }

        sector_data[sector]["stock_count"] += 1

        sector_data[sector][
            "total_change_percent"
        ] += change_percent

        sector_data[sector]["stocks"].append(
            {
                "symbol": stock.symbol,
                "change_percent": change_percent,
            }
        )

    result = []

    for sector, data in sector_data.items():
        stock_count = data["stock_count"]

        average_change = (
            data["total_change_percent"]
            / stock_count
        )

        result.append(
            {
                "sector": sector,
                "stock_count": stock_count,
                "average_change_percent": average_change,
                "stocks": data["stocks"],
            }
        )

    result.sort(
        key=lambda x: x["average_change_percent"],
        reverse=True,
    )

    return result