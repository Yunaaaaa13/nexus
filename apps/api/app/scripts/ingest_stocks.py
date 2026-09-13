import json
import time
from pathlib import Path
from datetime import datetime

import pandas as pd
import yfinance as yf
from sqlalchemy import select

from app.database.database import SessionLocal
from app.models.stock import Stock
from app.models.stock_price import StockPrice


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UNIVERSE_FILE = BASE_DIR / "nexus_stock_universe.json"
ERROR_FILE = BASE_DIR / "ingestion_errors.json"
PROGRESS_FILE = BASE_DIR / "ingestion_progress.json"

HISTORY_PERIOD = "1y"
HISTORY_INTERVAL = "1d"

BATCH_SIZE = 25
RETRY_COUNT = 3
RETRY_DELAY = 3


# ============================================================
# LOAD UNIVERSE
# ============================================================

def load_universe():
    if not UNIVERSE_FILE.exists():
        raise FileNotFoundError(
            f"Universe file not found: {UNIVERSE_FILE}"
        )

    with open(UNIVERSE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Hanya ticker yang tersedia di Yahoo
    stocks = [
        item
        for item in data
        if item.get("yahoo_available") is True
    ]

    # Pastikan tidak duplicate
    unique = {}

    for item in stocks:
        symbol = item.get("symbol")

        if not symbol:
            continue

        unique[symbol.upper()] = item

    return list(unique.values())


# ============================================================
# PROGRESS
# ============================================================

def load_progress():
    if not PROGRESS_FILE.exists():
        return {
            "completed": [],
            "failed": [],
        }

    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {
            "completed": [],
            "failed": [],
        }


def save_progress(completed, failed):
    data = {
        "completed": sorted(list(set(completed))),
        "failed": failed,
        "updated_at": datetime.utcnow().isoformat(),
    }

    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# ERROR LOG
# ============================================================

def save_errors(errors):
    with open(ERROR_FILE, "w", encoding="utf-8") as f:
        json.dump(
            errors,
            f,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# FETCH YAHOO DATA
# ============================================================

def fetch_history(yahoo_symbol):
    last_error = None

    for attempt in range(1, RETRY_COUNT + 1):

        try:
            print(
                f"    Yahoo request "
                f"{attempt}/{RETRY_COUNT}..."
            )

            ticker = yf.Ticker(yahoo_symbol)

            history = ticker.history(
                period=HISTORY_PERIOD,
                interval=HISTORY_INTERVAL,
                auto_adjust=False,
            )

            if history.empty:
                raise ValueError(
                    "Yahoo returned empty history"
                )

            return history

        except Exception as e:

            last_error = str(e)

            print(
                f"    Failed: {last_error}"
            )

            if attempt < RETRY_COUNT:
                time.sleep(RETRY_DELAY)

    raise RuntimeError(last_error)


# ============================================================
# NORMALIZE TIMESTAMP
# ============================================================

def normalize_timestamp(timestamp):
    """
    Convert Yahoo timestamp into naive datetime.
    """

    if hasattr(timestamp, "to_pydatetime"):
        timestamp = timestamp.to_pydatetime()

    # Jika timezone-aware
    if timestamp.tzinfo is not None:
        timestamp = timestamp.replace(tzinfo=None)

    return timestamp


# ============================================================
# INGEST ONE STOCK
# ============================================================

def ingest_stock(db, item):

    symbol = item["symbol"].upper()
    yahoo_symbol = item.get(
        "yahoo_symbol",
        f"{symbol}.JK",
    )

    print()
    print(
        f"  Processing {symbol} "
        f"({yahoo_symbol})"
    )

    # --------------------------------------------------------
    # Fetch Yahoo
    # --------------------------------------------------------

    history = fetch_history(yahoo_symbol)

    # --------------------------------------------------------
    # Create / update Stock
    # --------------------------------------------------------

    stock = db.execute(
        select(Stock)
        .where(Stock.symbol == symbol)
    ).scalar_one_or_none()

    if stock is None:

        stock = Stock(
            symbol=symbol,
            name=item.get(
                "name",
                symbol,
            ),
            sector=item.get("sector"),
        )

        db.add(stock)
        db.flush()

        print("    Created stock record.")

    else:

        # Update metadata bila tersedia
        if item.get("name"):
            stock.name = item["name"]

        if item.get("sector"):
            stock.sector = item["sector"]

        print("    Stock already exists.")

    # --------------------------------------------------------
    # Existing timestamps
    # --------------------------------------------------------

    existing_rows = db.execute(
        select(StockPrice.timestamp)
        .where(
            StockPrice.stock_id == stock.id
        )
    ).scalars().all()

    existing_timestamps = set(existing_rows)

    # --------------------------------------------------------
    # Insert historical prices
    # --------------------------------------------------------

    inserted = 0
    skipped = 0

    for timestamp, row in history.iterrows():

        timestamp = normalize_timestamp(timestamp)

        if timestamp in existing_timestamps:
            skipped += 1
            continue

        # Hindari data NaN
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
            volume_val = 0 if pd.isna(raw_volume) else int(raw_volume)

            price = StockPrice(
                stock_id=stock.id,
                timestamp=timestamp,
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=volume_val,
                source="Yahoo Finance",
            )

            db.add(price)

            inserted += 1

        except Exception:
            continue

    db.commit()

    print(
        f"    Inserted : {inserted}"
    )

    print(
        f"    Skipped  : {skipped}"
    )

    print(
        f"    Records  : {len(history)}"
    )

    return {
        "symbol": symbol,
        "inserted": inserted,
        "skipped": skipped,
        "records": len(history),
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print("NEXUS STOCK DATA INGESTION")
    print("=" * 70)

    # --------------------------------------------------------
    # Load universe
    # --------------------------------------------------------

    universe = load_universe()

    print()
    print(
        f"Yahoo-compatible stocks: "
        f"{len(universe)}"
    )

    # --------------------------------------------------------
    # Load progress
    # --------------------------------------------------------

    progress = load_progress()

    completed = set(
        progress.get("completed", [])
    )

    failed = progress.get(
        "failed",
        []
    )

    print(
        f"Already completed      : "
        f"{len(completed)}"
    )

    print(
        f"Remaining               : "
        f"{len(universe) - len(completed)}"
    )

    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    db = SessionLocal()

    total_inserted = 0
    total_skipped = 0
    processed_now = 0

    try:

        for index, item in enumerate(
            universe,
            start=1,
        ):

            symbol = item["symbol"].upper()

            # ------------------------------------------------
            # Skip completed
            # ------------------------------------------------

            if symbol in completed:

                print(
                    f"[{index}/{len(universe)}] "
                    f"{symbol} → SKIP"
                )

                continue

            print()
            print("-" * 70)

            print(
                f"[{index}/{len(universe)}] "
                f"Starting {symbol}"
            )

            # ------------------------------------------------
            # Process
            # ------------------------------------------------

            try:

                result = ingest_stock(
                    db,
                    item,
                )

                completed.add(symbol)

                total_inserted += result[
                    "inserted"
                ]

                total_skipped += result[
                    "skipped"
                ]

                processed_now += 1

                # Remove previous failure
                failed = [
                    error
                    for error in failed
                    if error.get("symbol")
                    != symbol
                ]

            except Exception as e:

                print()
                print(
                    f"    ERROR: {symbol}"
                )

                print(
                    f"    {str(e)}"
                )

                failed.append(
                    {
                        "symbol": symbol,
                        "yahoo_symbol": item.get(
                            "yahoo_symbol"
                        ),
                        "error": str(e),
                    }
                )

                db.rollback()

            # ------------------------------------------------
            # Save progress
            # ------------------------------------------------

            save_progress(
                completed,
                failed,
            )

            save_errors(failed)

            # ------------------------------------------------
            # Small delay
            # ------------------------------------------------

            time.sleep(1)

            # ------------------------------------------------
            # Batch checkpoint
            # ------------------------------------------------

            if (
                processed_now > 0
                and processed_now % BATCH_SIZE == 0
            ):

                print()
                print(
                    "=" * 70
                )

                print(
                    "BATCH CHECKPOINT"
                )

                print(
                    f"Processed this run: "
                    f"{processed_now}"
                )

                print(
                    f"Completed total: "
                    f"{len(completed)}"
                )

                print(
                    f"Failed: "
                    f"{len(failed)}"
                )

                print(
                    "=" * 70
                )

                time.sleep(3)

    finally:

        db.close()

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("INGESTION COMPLETE")
    print("=" * 70)

    print(
        f"Universe             : "
        f"{len(universe)}"
    )

    print(
        f"Completed             : "
        f"{len(completed)}"
    )

    print(
        f"Failed                : "
        f"{len(failed)}"
    )

    print(
        f"Inserted this run     : "
        f"{total_inserted}"
    )

    print(
        f"Skipped this run      : "
        f"{total_skipped}"
    )

    print()
    print(
        f"Progress file:"
    )

    print(
        PROGRESS_FILE
    )

    print()
    print(
        f"Error file:"
    )

    print(
        ERROR_FILE
    )

    print()
    print(
        "Next run will resume "
        "from unfinished stocks."
    )


if __name__ == "__main__":
    main()