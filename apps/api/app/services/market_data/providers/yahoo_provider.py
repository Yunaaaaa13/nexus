import time
from datetime import datetime
import zoneinfo
import requests
import yfinance as yf
from app.services.market_data.base import MarketDataProvider


class YahooFinanceProvider(MarketDataProvider):

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        })

    def get_stock(self, symbol: str):
        ticker = yf.Ticker(f"{symbol}.JK", session=self.session)
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
        ticker = yf.Ticker(f"{symbol}.JK", session=self.session)
        history = ticker.history(
            period="1y",
            interval="1d"
        )

        if history.empty:
            time.sleep(1)
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
        ticker = yf.Ticker("^JKSE", session=self.session)
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

    def get_index_overview(self, symbol: str = "IHSG"):
        target_ticker = "^JKSE" if symbol.upper() in ["IHSG", "COMPOSITE", "^JKSE"] else f"^{symbol.upper()}"
        ticker = yf.Ticker(target_ticker, session=self.session)

        # Intraday data untuk mendapatkan harga terbaru
        intraday = ticker.history(
            period="1d",
            interval="5m",
        )

        if intraday.empty:
            intraday = ticker.history(
                period="5d",
                interval="5m",
            )

        if intraday.empty:
            raise ValueError("No intraday IHSG data found")

        latest = intraday.iloc[-1]

        # Daily data untuk mendapatkan session stats & previous close
        daily = ticker.history(
            period="5d",
            interval="1d",
        )

        if daily.empty:
            raise ValueError("No daily IHSG data found")

        latest_daily = daily.iloc[-1]

        open_price = float(latest_daily["Open"])
        high_price = float(latest_daily["High"])
        low_price = float(latest_daily["Low"])
        current_price = float(latest["Close"])

        # Gunakan session open sebagai base agar identik dengan Hero MarketPulse
        base_price = open_price if open_price > 0 else (float(daily.iloc[-2]["Close"]) if len(daily) >= 2 else current_price)
        change = current_price - base_price
        change_percent = (change / base_price) * 100 if base_price > 0 else 0.0

        return {
            "symbol": "IHSG",
            "name": "IHSG",
            "price": round(current_price, 2),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 3),
            "timestamp": intraday.index[-1].isoformat(),
            "source": "Yahoo Finance",
            "available": True,
        }


    def get_index_intraday(self, symbol: str = "IHSG", interval: str = "5m"):
        target_ticker = "^JKSE" if symbol.upper() in ["IHSG", "COMPOSITE", "^JKSE"] else f"^{symbol.upper()}"
        ticker = yf.Ticker(target_ticker, session=self.session)

        # Ambil 5 hari untuk memastikan sesi trading terakhir tersedia
        df = ticker.history(period="5d", interval=interval)

        if df.empty:
            time.sleep(1)
            df = ticker.history(period="5d", interval=interval)

        if df.empty:
            raise ValueError(f"No intraday data found for index {symbol}")

        # Konversi timezone ke Asia/Jakarta (WIB)
        df_tz = df.copy()
        if df_tz.index.tz is None:
            df_tz.index = df_tz.index.tz_localize("UTC").tz_convert("Asia/Jakarta")
        else:
            df_tz.index = df_tz.index.tz_convert("Asia/Jakarta")

        # Ambil tanggal trading terakhir
        dates = df_tz.index.strftime("%Y-%m-%d")
        latest_date = sorted(list(set(dates)))[-1]
        session_df = df_tz[dates == latest_date]

        if session_df.empty:
            raise ValueError(f"No session candles available for date {latest_date}")

        open_price = float(session_df["Open"].iloc[0])
        latest_price = float(session_df["Close"].iloc[-1])
        high_price = float(session_df["High"].max())
        low_price = float(session_df["Low"].min())
        change = latest_price - open_price
        change_percent = (change / open_price * 100) if open_price > 0 else 0.0

        # Cek jam bursa IDX (Senin - Jumat, 09:00 - 16:00 WIB)
        jakarta_tz = zoneinfo.ZoneInfo("Asia/Jakarta")
        now_wib = datetime.now(jakarta_tz)
        is_weekday = now_wib.weekday() < 5
        market_start = now_wib.replace(hour=9, minute=0, second=0, microsecond=0)
        market_end = now_wib.replace(hour=16, minute=0, second=0, microsecond=0)
        is_market_open = is_weekday and (market_start <= now_wib <= market_end)
        market_status = "Open" if is_market_open else "Closed"

        candles = []
        for ts, row in session_df.iterrows():
            candles.append({
                "time": ts.strftime("%H:%M"),
                "timestamp": ts.isoformat(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0)),
            })

        return {
            "symbol": "COMPOSITE",
            "name": "IHSG",
            "session_date": latest_date,
            "market_status": market_status,
            "latest_price": round(latest_price, 2),
            "open_price": round(open_price, 2),
            "high_price": round(high_price, 2),
            "low_price": round(low_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "last_updated": session_df.index[-1].isoformat(),
            "last_updated_time": session_df.index[-1].strftime("%H:%M:%S"),
            "candles_count": len(candles),
            "candles": candles,
            "source": "Yahoo Finance (Delayed)"
        }

    def get_top_gainers(self):
        raise NotImplementedError(
            "Top gainers will be implemented later."
        )

    def get_top_losers(self):
        raise NotImplementedError(
            "Top losers will be implemented later."
        )

