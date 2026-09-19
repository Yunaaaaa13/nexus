import json
import sys
import time
from pathlib import Path

import yfinance as yf
from sqlalchemy import select

from app.database.database import SessionLocal
from app.models.stock import Stock


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

UNIVERSE_FILE = BASE_DIR / "nexus_stock_universe.json"
PROGRESS_FILE = BASE_DIR / "metadata_enrichment_progress.json"
ERROR_FILE = BASE_DIR / "metadata_enrichment_errors.json"

BATCH_SIZE = 10
RETRY_COUNT = 3
RETRY_DELAY = 3
THROTTLE = 0.35


# ============================================================
# NORMALIZE YAHOO SECTOR -> NEXUS SECTOR LABEL
# ============================================================

SECTOR_NORMALIZE = {
    "Financial Services": "Financials",
    "Financials": "Financials",
    "Basic Materials": "Basic Materials",
    "Materials": "Basic Materials",
    "Consumer Defensive": "Consumer Staples",
    "Consumer Staples": "Consumer Staples",
    "Consumer Cyclical": "Consumer Cyclical",
    "Consumer Discretionary": "Consumer Cyclical",
    "Energy": "Energy",
    "Industrials": "Industrials",
    "Health Care": "Healthcare",
    "Healthcare": "Healthcare",
    "Information Technology": "Technology",
    "Technology": "Technology",
    "Utilities": "Utilities",
    "Communication Services": "Communication Services",
    "Real Estate": "Real Estate",
}


def normalize_sector(value):
    if not value:
        return None

    key = value.strip()

    if key == "":
        return None

    return SECTOR_NORMALIZE.get(key, key.title())


# ============================================================
# LOAD UNIVERSE (untuk mapping yahoo_symbol)
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


# ============================================================
# PROGRESS
# ============================================================

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
        "total": len(completed) + len(failed),
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


# ============================================================
# FETCH YAHOO INFO
# ============================================================

def fetch_info(yahoo_symbol):
    last_error = None

    for attempt in range(1, RETRY_COUNT + 1):

        try:
            ticker = yf.Ticker(yahoo_symbol)
            info = ticker.info

            if not info:
                raise ValueError(
                    "Yahoo returned empty info"
                )

            return info

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
# ENRICH ONE STOCK
# ============================================================

def enrich_stock(db, stock, info, changed):

    sector = normalize_sector(info.get("sector"))
    industry = (info.get("industry") or "").strip() or None
    long_name = (info.get("longName") or "").strip() or None

    if sector and (
        stock.sector is None
        or stock.sector.strip() == ""
    ):
        stock.sector = sector
        changed.append(
            f"  {stock.symbol}: sector -> {sector}"
        )

    if industry:
        stock.subsector = industry
        changed.append(
            f"  {stock.symbol}: subsector -> {industry}"
        )

    if (
        long_name
        and stock.name.strip() == stock.symbol.strip()
    ):
        stock.name = long_name.strip()
        changed.append(
            f"  {stock.symbol}: name -> {stock.name}"
        )

    return stock


# ============================================================
# MAIN
# ============================================================

def main():

    # ------------------------------------------------
    # CLI args: --limit=N, --force
    # ------------------------------------------------

    args = sys.argv[1:]

    force = "--force" in args

    limit = None

    for arg in args:
        if arg.startswith("--limit="):
            try:
                limit = int(arg.split("=", 1)[1])
            except ValueError:
                limit = None

    print()
    print("=" * 70)
    print("NEXUS METADATA ENRICHMENT (Yahoo Finance)")
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
        print(f"Force refresh           : {force}")

        pending = []

        for stock in stocks:

            if stock.symbol in completed and not force:
                continue

            if not force and (
                stock.sector
                and stock.sector.strip() != ""
                and stock.subsector
                and stock.name != stock.symbol
            ):
                continue

            pending.append(stock)

        if limit:
            pending = pending[:limit]

        print(f"Pending this run        : {len(pending)}")

        enriched = 0
        errored = 0

        for index, stock in enumerate(
            pending,
            start=1,
        ):

            symbol = stock.symbol

            yahoo_symbol = yahoo_symbol_map.get(
                symbol,
                f"{symbol}.JK",
            )

            print()
            print(
                f"[{index}/{len(pending)}] "
                f"{symbol} ({yahoo_symbol})"
            )

            changed = []

            try:

                info = fetch_info(yahoo_symbol)

                enrich_stock(db, stock, info, changed)

                for line in changed:
                    print(line)

                db.commit()

                completed.add(symbol)

                failed = [
                    error
                    for error in failed
                    if error.get("symbol") != symbol
                ]

                enriched += 1

            except Exception as e:

                print(
                    f"    ERROR: {symbol} -> {str(e)}"
                )

                failed.append(
                    {
                        "symbol": symbol,
                        "yahoo_symbol": yahoo_symbol,
                        "error": str(e),
                    }
                )

                db.rollback()

                errored += 1

            # ----------------------------------------
            # Checkpoint
            # ----------------------------------------

            save_progress(completed, failed)
            save_errors(failed)

            time.sleep(THROTTLE)

            # ----------------------------------------
            # Batch commit checkpoint
            # ----------------------------------------

            if (
                index > 0
                and index % BATCH_SIZE == 0
            ):

                print()
                print("-" * 70)
                print(
                    f"Checkpoint: enriched {enriched}, "
                    f"errored {errored}"
                )
                print("-" * 70)

                db.commit()

    finally:

        db.close()

    print()
    print("=" * 70)
    print("ENRICHMENT COMPLETE")
    print("=" * 70)
    print(f"Enriched this run       : {enriched}")
    print(f"Errored this run        : {errored}")
    print(f"Completed total         : {len(completed)}")
    print(f"Failed total            : {len(failed)}")
    print()


if __name__ == "__main__":
    main()