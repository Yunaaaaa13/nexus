import time
from datetime import datetime
import zoneinfo
import requests
import pandas as pd
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

    def get_index_history(self, symbol: str = "IHSG", period: str = "1D", interval: str = ""):
        PERIOD_MAP = {
            "1D": {
                "yf_period": "5d",
                "default_interval": "5m",
                "intervals": ["1m", "5m", "15m", "30m"],
            },
            "5D": {
                "yf_period": "5d",
                "default_interval": "15m",
                "intervals": ["15m", "30m"],
            },
            "1M": {
                "yf_period": "1mo",
                "default_interval": "1d",
                "intervals": ["1h", "4h", "1d"],
            },
            "3M": {
                "yf_period": "3mo",
                "default_interval": "1d",
                "intervals": ["1h", "4h", "1d"],
            },
            "6M": {
                "yf_period": "6mo",
                "default_interval": "1d",
                "intervals": ["1h", "4h", "1d"],
            },
            "1Y": {
                "yf_period": "1y",
                "default_interval": "1d",
                "intervals": ["1d", "1wk"],
            },
            "5Y": {
                "yf_period": "5y",
                "default_interval": "1wk",
                "intervals": ["1wk", "1mo"],
            },
            "ALL": {
                "yf_period": "max",
                "default_interval": "1y",
                "intervals": ["1y"],
                "fetch_interval": "1mo",
                "resample": "yearly",
            },
        }

        if period not in PERIOD_MAP:
            raise ValueError(f"Invalid period '{period}'. Must be one of: {', '.join(PERIOD_MAP.keys())}")

        yf_params = PERIOD_MAP[period]
        yf_interval = interval if interval and interval in yf_params["intervals"] else yf_params["default_interval"]
        fetch_interval = yf_params.get("fetch_interval", yf_interval)

        target_ticker = "^JKSE" if symbol.upper() in ["IHSG", "COMPOSITE", "^JKSE"] else f"^{symbol.upper()}"
        ticker = yf.Ticker(target_ticker, session=self.session)

        df = ticker.history(period=yf_params["yf_period"], interval=fetch_interval)

        if df.empty:
            time.sleep(1)
            df = ticker.history(period=yf_params["yf_period"], interval=fetch_interval)

        if df.empty:
            raise ValueError(f"No history data found for index {symbol} with period {period} and interval {interval}")

        # Konversi timezone ke Asia/Jakarta (WIB)
        df_tz = df.copy()
        if df_tz.index.tz is None:
            df_tz.index = df_tz.index.tz_localize("UTC").tz_convert("Asia/Jakarta")
        else:
            df_tz.index = df_tz.index.tz_convert("Asia/Jakarta")

        # Untuk interval tahunan, agregasi data per tahun
        if yf_params.get("resample") == "yearly":
            yearly = df_tz.groupby(df_tz.index.year).agg({
                "Open": "first",
                "High": "max",
                "Low": "min",
                "Close": "last",
                "Volume": "sum",
            })
            yearly.index = [
                pd.Timestamp(year=int(y), month=12, day=31, tzinfo=zoneinfo.ZoneInfo("Asia/Jakarta"))
                for y in yearly.index
            ]
            df_tz = yearly

        # Cek jam bursa IDX
        jakarta_tz = zoneinfo.ZoneInfo("Asia/Jakarta")
        now_wib = datetime.now(jakarta_tz)
        is_weekday = now_wib.weekday() < 5
        market_start = now_wib.replace(hour=9, minute=0, second=0, microsecond=0)
        market_end = now_wib.replace(hour=16, minute=0, second=0, microsecond=0)
        is_market_open = is_weekday and (market_start <= now_wib <= market_end)
        market_status = "Open" if is_market_open else "Closed"

        # Untuk 1D, filter hanya tanggal trading terakhir
        if period == "1D" and yf_interval in ["1m", "5m", "15m", "30m"]:
            dates = df_tz.index.strftime("%Y-%m-%d")
            latest_date = sorted(list(set(dates)))[-1]
            df_tz = df_tz[dates == latest_date]

            if df_tz.empty:
                raise ValueError(f"No session candles available for date {latest_date}")

        # Daily data terbaru untuk "current performance" yang konsisten:
        # harga utama + perubahan terhadap previous close tetap berbasis
        # baris harian terakhir, terlepas dari interval window yang dipilih user.
        # Ini menghindari +902% yang salah untuk window 1Y/5Y/ALL, dan
        # mencegah latest_price menjadi "stale" pada window mingguan/bulanan.
        daily_df = None
        try:
            daily_fetch = ticker.history(period="5d", interval="1d")
            if not daily_fetch.empty:
                daily_df = daily_fetch.copy()
                if daily_df.index.tz is None:
                    daily_df.index = daily_df.index.tz_localize("UTC").tz_convert("Asia/Jakarta")
                else:
                    daily_df.index = daily_df.index.tz_convert("Asia/Jakarta")
        except Exception:
            daily_df = None

        latest_price = None
        previous_close = None
        last_updated = None
        last_updated_time = None

        if daily_df is not None and not daily_df.empty:
            latest_price = float(daily_df["Close"].iloc[-1])
            last_updated = daily_df.index[-1].isoformat()
            last_updated_time = daily_df.index[-1].strftime("%H:%M:%S")
            if len(daily_df) >= 2:
                prev = float(daily_df["Close"].iloc[-2])
                if not pd.isna(prev):
                    previous_close = prev

        # Fallback ke window jika daily tidak tersedia
        if latest_price is None:
            latest_price = float(df_tz["Close"].iloc[-1])
            last_updated = df_tz.index[-1].isoformat()
            last_updated_time = df_tz.index[-1].strftime("%H:%M:%S")

        open_price = float(df_tz["Open"].iloc[0])
        high_price = float(df_tz["High"].max())
        low_price = float(df_tz["Low"].min())

        if previous_close and previous_close > 0:
            change = latest_price - previous_close
            change_percent = (change / previous_close * 100)
        else:
            change = 0.0
            change_percent = 0.0

        is_intraday = yf_interval in ["1m", "5m", "15m", "30m", "1h", "4h"]

        candles = []
        for ts, row in df_tz.iterrows():
            if is_intraday:
                time_str = ts.strftime("%H:%M")
            else:
                time_str = ts.strftime("%Y-%m-%d")
            candles.append({
                "time": time_str,
                "timestamp": ts.timestamp(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0)),
            })

        return {
            "symbol": "COMPOSITE",
            "name": "IHSG",
            "period": period,
            "interval": yf_interval,
            "intervals": yf_params["intervals"],
            "market_status": market_status,
            "latest_price": round(latest_price, 2),
            "open_price": round(open_price, 2),
            "high_price": round(high_price, 2),
            "low_price": round(low_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "last_updated": last_updated,
            "last_updated_time": last_updated_time,
            "candles_count": len(candles),
            "candles": candles,
            "source": "Yahoo Finance (Delayed)",
        }

    def get_top_gainers(self):
        raise NotImplementedError(
            "Top gainers will be implemented later."
        )

    def get_top_losers(self):
        raise NotImplementedError(
            "Top losers will be implemented later."
        )

