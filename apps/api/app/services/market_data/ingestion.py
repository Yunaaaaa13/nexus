from datetime import datetime

from sqlalchemy.orm import Session

from app.models.stock import Stock
from app.models.stock_price import StockPrice
from app.models.index import MarketIndex
from app.models.index_price import IndexPrice

from app.services.market_data.providers.yahoo_provider import (
    YahooFinanceProvider,
)


class MarketDataIngestionService:

    def __init__(self, provider=None):
        self.provider = provider or YahooFinanceProvider()

    def _parse_timestamp(self, timestamp: str) -> datetime:
        """
        Convert ISO timestamp from Yahoo Finance into
        a naive datetime suitable for the current database schema.
        """
        dt = datetime.fromisoformat(timestamp)

        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)

        return dt

    def sync_index(self, db: Session, symbol: str = "IHSG"):
        # 1. Fetch data from provider
        data = self.provider.get_index(symbol)

        # 2. Find existing index
        market_index = (
            db.query(MarketIndex)
            .filter(MarketIndex.symbol == data["symbol"])
            .first()
        )

        # 3. Create index master data if it doesn't exist
        if not market_index:
            market_index = MarketIndex(
                symbol=data["symbol"],
                name=data["name"],
                description="Indonesian Stock Market Composite Index",
            )

            db.add(market_index)
            db.flush()

        timestamp = self._parse_timestamp(data["timestamp"])

        # 4. Check duplicate price data
        existing_price = (
            db.query(IndexPrice)
            .filter(
                IndexPrice.index_id == market_index.id,
                IndexPrice.timestamp == timestamp,
            )
            .first()
        )

        # 5. Insert only if data doesn't exist
        if not existing_price:
            index_price = IndexPrice(
                index_id=market_index.id,
                timestamp=timestamp,
                open=data["open"],
                high=data["high"],
                low=data["low"],
                close=data["price"],
                change=data.get("change"),
                change_percent=data.get("change_percent"),
                source=data["source"],
            )

            db.add(index_price)
            db.commit()
            db.refresh(index_price)

            return {
                "action": "inserted",
                "index": data,
                "database_id": index_price.id,
            }

        return {
            "action": "already_exists",
            "index": data,
            "database_id": existing_price.id,
        }

    def sync_stock(
        self,
        db: Session,
        symbol: str,
    ):
        # 1. Fetch data from provider
        data = self.provider.get_stock(symbol.upper())

        symbol = data["symbol"]

        # 2. Find existing stock
        stock = (
            db.query(Stock)
            .filter(Stock.symbol == symbol)
            .first()
        )

        # 3. Create stock master data if it doesn't exist
        if not stock:
            stock = Stock(
                symbol=symbol,
                name=symbol,
            )

            db.add(stock)
            db.flush()

        timestamp = self._parse_timestamp(data["timestamp"])

        # 4. Check duplicate price data
        existing_price = (
            db.query(StockPrice)
            .filter(
                StockPrice.stock_id == stock.id,
                StockPrice.timestamp == timestamp,
            )
            .first()
        )

        # 5. Insert only if data doesn't exist
        if not existing_price:
            stock_price = StockPrice(
                stock_id=stock.id,
                timestamp=timestamp,
                open=data["open"],
                high=data["high"],
                low=data["low"],
                close=data["price"],
                volume=data["volume"],
                source=data["source"],
            )

            db.add(stock_price)
            db.commit()
            db.refresh(stock_price)

            return {
                "action": "inserted",
                "stock": data,
                "database_id": stock_price.id,
            }

        return {
            "action": "already_exists",
            "stock": data,
            "database_id": existing_price.id,
        }
