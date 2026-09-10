from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.stock_price import StockPrice


def get_market_breadth(db: Session):
    stocks = db.execute(
        select(Stock)
        .order_by(Stock.symbol)
    ).scalars().all()

    advancing = []
    declining = []
    unchanged = []

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

        # Membutuhkan harga terbaru
        # dan harga sebelumnya
        if len(prices) < 2:
            continue

        latest = prices[0]
        previous = prices[1]

        latest_close = float(latest.close)
        previous_close = float(previous.close)

        if latest_close > previous_close:
            advancing.append(stock.symbol)

        elif latest_close < previous_close:
            declining.append(stock.symbol)

        else:
            unchanged.append(stock.symbol)

    total = (
        len(advancing)
        + len(declining)
        + len(unchanged)
    )

    if total > 0:
        advancing_percent = (
            len(advancing) / total
        ) * 100

        declining_percent = (
            len(declining) / total
        ) * 100

        unchanged_percent = (
            len(unchanged) / total
        ) * 100
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

        "advance_decline_ratio": (
            advance_decline_ratio
        ),
    }