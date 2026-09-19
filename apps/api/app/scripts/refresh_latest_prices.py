import json
import sys
import time
from datetime import datetime, date, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf
from sqlalchemy import select, func

from app.database.database import SessionLocal
from app.models.stock import Stock
from app.models.stock_price import StockPrice


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UNIVERSE_FILE = BASE_DIR / "nexus_stock_universe.json"
PROGRESS_FILE = BASE_DIR / "latest_refresh_progress.json"
ERROR_FILE = BASE_DIR / "latest_refresh_errors.json"

HISTORY_INTERVAL = "1d"

RETRY_COUNT = 3
RETRY_DELAY = 4
THROTTLE = 0.4

BATCH_CHECKPOINT = 25


# ============================================================
# HELPERS
# ============================================================

def load_yahoo_symbol_map():
    if not UNIVERSE_FILE.exists():
        return {}

    with open(
        UNIVERSE_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    return {
        item.get("symbol", "").upper(): item.get(
            "yahoo_symbol",
            f"{item.get('symbol', '')}.JK",
        )
        for item in data
        if item.get("symbol")
    }


def load_progress():
    if not PROGRESS_FILE.exists():
        return {"completed": [], "failed": []}

    try:
        with open(
            PROGRESS_FILE,
            "r",
            encoding="utf-8",
        ) as f:
            return json.load(f)
    except Exception:
        return {"completed": [], "failed": []}


def save_progress(completed, failed):
    data = {
        "completed": sorted(list(set(completed))),
        "failed": failed,
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    with open(
        PROGRESS_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def save_errors(errors):
    with open(
        ERROR_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            errors,
            f,
            indent=2,
            ensure_ascii=False,
        )


def normalize_timestamp(timestamp):
    if hasattr(timestamp, "to_pydatetime"):
        timestamp = timestamp.to_pydatetime()

    if timestamp.tzinfo is not None:
        timestamp = timestamp.replace(tzinfo=None)

    return timestamp


def fetch_history_since(yahoo_symbol, start_date):
    last_error = None

    for attempt in range(1, RETRY_COUNT + 1):

        try:
            ticker = yf.Ticker(yahoo_symbol)

            history = ticker.history(
                start=start_date,
                interval=HISTORY_INTERVAL,
                auto_adjust=False,
            )

            if history.empty:
                return pd.DataFrame()

            return history

        except Exception as e:

            last_error = str(e)

            print(
                f"    Retry {attempt}/{RETRY_COUNT}: "
                f"{last_error}"
            )

            if attempt < RETRY_COUNT:
                time.sleep(RETRY_DELAY)

    raise RuntimeError(last_error)


# ============================================================
# MAIN
# ============================================================

def main():

    args = sys.argv[1:]

    limit = None

    for arg in args:
        if arg.startswith("--limit="):
            try:
                limit = int(arg.split("=", 1)[1])
            except ValueError:
                limit = None

    skip_none = "--skip-none" in args

    print()
    print("=" * 70)
    print("NEXUS LATEST PRICE REFRESH (Yahoo Finance)")
    print("=" * 70)

    yahoo_symbol_map = load_yahoo_symbol_map()

    progress = load_progress()

    completed = set(progress.get("completed", []))
    failed = progress.get("failed", [])

    db = SessionLocal()

    try:

        stocks = db.execute(
            select(Stock).order_by(Stock.symbol.asc())
        ).scalars().all()

        print(f"Stocks in DB            : {len(stocks)}")
        print(f"Already completed       : {len(completed)}")
        print(f"Failed so far           : {len(failed)}")

        stats = []

        for stock in stocks:

            if stock.symbol in completed:
                continue

            last_ts = db.execute(
                select(func.max(StockPrice.timestamp)).where(
                    StockPrice.stock_id == stock.id
                )
            ).scalar()

            stats.append(
                (stock, last_ts)
            )

        if limit:
            stats = stats[:limit]

        print(f"Pending this run        : {len(stats)}")

        refreshed = 0
        errored = 0
        total_inserted = 0

        for index, (stock, last_ts) in enumerate(
            stats,
            start=1,
        ):

            symbol = stock.symbol

            yahoo_symbol = yahoo_symbol_map.get(
                symbol,
                f"{symbol}.JK",
            )

            if last_ts is None:
                start_date = date.today() - timedelta(days=370)
            else:
                start_date = (
                    last_ts + timedelta(days=1)
                ).date()

            print()
            print(
                f"[{index}/{len(stats)}] "
                f"{symbol} (last={last_ts.date() if last_ts else 'none'})"
            )

            try:

                history = fetch_history_since(
                    yahoo_symbol,
                    start_date,
                )

                if history.empty:
                    if not skip_none:
                        completed.add(symbol)
                        print("    No new rows.")
                    else:
                        print(
                            "    No new rows (SKIP, "
                            "will retry next run)."
                        )
                    refreshed += 1
                    db.commit()
                    save_progress(completed, failed)
                    save_errors(failed)
                    time.sleep(THROTTLE)
                    continue

                existing_rows = db.execute(
                    select(StockPrice.timestamp).where(
                        StockPrice.stock_id == stock.id
                    )
                ).scalars().all()

                existing_timestamps = set(existing_rows)

                inserted = 0

                for timestamp, row in history.iterrows():

                    timestamp = normalize_timestamp(timestamp)

                    if timestamp in existing_timestamps:
                        continue

                    values = [
                        row["Open"],
                        row["High"],
                        row["Low"],
                        row["Close"],
                    ]

                    if any(
                        pd.isna(value)
                        for value in values
                    ):
                        continue

                    try:
                        raw_volume = row.get("Volume", 0)
                        volume_val = (
                            0
                            if pd.isna(raw_volume)
                            else int(raw_volume)
                        )

                        db.add(
                            StockPrice(
                                stock_id=stock.id,
                                timestamp=timestamp,
                                open=float(row["Open"]),
                                high=float(row["High"]),
                                low=float(row["Low"]),
                                close=float(row["Close"]),
                                volume=volume_val,
                                source="Yahoo Finance",
                            )
                        )

                        inserted += 1

                    except Exception:
                        continue

                if inserted > 0:
                    print(f"    Inserted: {inserted} new rows")

                db.commit()

                completed.add(symbol)

                failed = [
                    error
                    for error in failed
                    if error.get("symbol") != symbol
                ]

                refreshed += 1
                total_inserted += inserted

            except Exception as e:

                print(f"    ERROR: {symbol} -> {str(e)}")

                failed.append(
                    {
                        "symbol": symbol,
                        "yahoo_symbol": yahoo_symbol,
                        "last_timestamp": (
                            last_ts.isoformat()
                            if last_ts
                            else None
                        ),
                        "error": str(e),
                    }
                )

                db.rollback()

                errored += 1

            save_progress(completed, failed)
            save_errors(failed)

            time.sleep(THROTTLE)

            if (
                index > 0
                and index % BATCH_CHECKPOINT == 0
            ):

                print()
                print("-" * 70)
                print(
                    f"Checkpoint: refreshed {refreshed}, "
                    f"errored {errored}, "
                    f"inserted {total_inserted}"
                )
                print("-" * 70)

                db.commit()

    finally:

        db.close()

    print()
    print("=" * 70)
    print("REFRESH COMPLETE")
    print("=" * 70)
    print(f"Refreshed this run      : {refreshed}")
    print(f"Errored this run        : {errored}")
    print(f"Total inserted          : {total_inserted}")
    print(f"Completed total         : {len(completed)}")
    print(f"Failed total            : {len(failed)}")
    print()


if __name__ == "__main__":
    main()