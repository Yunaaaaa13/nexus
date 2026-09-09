import yfinance as yf
from app.services.market_data.base import MarketDataProvider


class YahooFinanceProvider(MarketDataProvider):

    def get_stock(self, symbol: str):
        ticker = yf.Ticker(f"{symbol}.JK")
        history = ticker.history(
            period="1d",
            interval="1d"
        )

        if history.empty:
            history = ticker.history(
                period="5d",
                interval="1d"
            )

        if history.empty:
            raise ValueError(
                f"No market data found for {symbol}"
            )

        latest = history.iloc[-1]

        return {
            "symbol": symbol,
            "price": float(latest["Close"]),
            "open": float(latest["Open"]),
            "high": float(latest["High"]),
            "low": float(latest["Low"]),
            "volume": int(latest["Volume"]),
            "timestamp": history.index[-1].isoformat(),
            "source": "Yahoo Finance"
        }

    def get_stock_history(self, symbol: str):
        ticker = yf.Ticker(f"{symbol}.JK")
        history = ticker.history(
            period="1y",
            interval="1d"
        )

        if history.empty:
            raise ValueError(
                f"No historical data found for {symbol}"
            )

        result = []
        for timestamp, row in history.iterrows():
            result.append({
                "timestamp": timestamp.isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"])
            })

        return result

    def get_index(self, symbol: str):
        ticker = yf.Ticker("^JKSE")
        history = ticker.history(
            period="1d",
            interval="1d"
        )

        if history.empty:
            history = ticker.history(
                period="5d",
                interval="1d"
            )

        if history.empty:
            raise ValueError(
                "No IHSG data found"
            )

        latest = history.iloc[-1]

        return {
            "symbol": "COMPOSITE",
            "name": "IHSG",
            "price": float(latest["Close"]),
            "open": float(latest["Open"]),
            "high": float(latest["High"]),
            "low": float(latest["Low"]),
            "volume": int(latest["Volume"]),
            "timestamp": history.index[-1].isoformat(),
            "source": "Yahoo Finance"
        }

    def get_top_gainers(self):
        raise NotImplementedError(
            "Top gainers will be implemented later."
        )

    def get_top_losers(self):
        raise NotImplementedError(
            "Top losers will be implemented later."
        )
