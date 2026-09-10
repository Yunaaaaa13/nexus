from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.stock_price import StockPrice


def get_top_movers(
    db: Session,
    limit: int = 5,
):
    stocks = db.execute(
        select(Stock)
        .order_by(Stock.symbol)
    ).scalars().all()

    movers = []

    for stock in stocks:
        prices = db.execute(
            select(StockPrice)
            .where(StockPrice.stock_id == stock.id)
            .order_by(StockPrice.timestamp.desc())
            .limit(2)
        ).scalars().all()

        # Minimal membutuhkan harga terbaru
        # dan harga sebelumnya
        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if previous_close == 0:
            continue

        change = latest_close - previous_close

        change_percent = (
            change / previous_close
        ) * 100

        movers.append(
            {
                "symbol": stock.symbol,
                "name": stock.name,
                "sector": stock.sector,
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
