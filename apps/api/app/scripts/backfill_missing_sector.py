import json
import time
from pathlib import Path

from sqlalchemy import select

from app.database.database import SessionLocal
from app.models.stock import Stock


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
UNIVERSE_FILE = BASE_DIR / "nexus_stock_universe.json"

OVERRIDES = {
    "BOSS": {
        "sector": "Energy",
        "subsector": "Oil & Gas Equipment & Services",
    },
    "DEAL": {
        "sector": "Industrials",
        "subsector": "Integrated Freight & Logistics",
    },
    "ETWA": {
        "sector": "Basic Materials",
        "subsector": "Chemicals",
    },
    "KAYU": {
        "sector": "Basic Materials",
        "subsector": "Lumber & Wood Production",
    },
    "LAPD": {
        "sector": "Industrials",
        "subsector": "Industrial Distribution",
    },
    "META": {
        "sector": "Industrials",
        "subsector": "Infrastructure Operations",
    },
}


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 70)
    print("NEXUS SECTOR BACKFILL (curated IDXIC overrides)")
    print("=" * 70)

    db = SessionLocal()

    try:

        stocks = db.execute(
            select(Stock).order_by(Stock.symbol.asc())
        ).scalars().all()

        updated = 0

        for stock in stocks:

            if stock.symbol not in OVERRIDES:
                continue

            patch = OVERRIDES[stock.symbol]

            old_sector = stock.sector
            old_subsector = stock.subsector

            stock.sector = patch["sector"]
            stock.subsector = patch["subsector"]

            print(
                f"{stock.symbol}: "
                f"{old_sector or 'NULL'}/{old_subsector or 'NULL'} "
                f"-> {patch['sector']}/{patch['subsector']}"
            )

            updated += 1

        db.commit()

        # persistence: keep universe json in sync
        if UNIVERSE_FILE.exists():

            with open(
                UNIVERSE_FILE,
                "r",
                encoding="utf-8",
            ) as f:
                data = json.load(f)

            changed = False

            by_symbol = {
                stock.symbol: stock
                for stock in stocks
            }

            for item in data:

                symbol = str(
                    item.get("symbol", "")
                ).upper()

                if symbol not in OVERRIDES:
                    continue

                stock = by_symbol.get(symbol)

                if stock is None:
                    continue

                item["sector"] = stock.sector
                item["subsector"] = stock.subsector

                changed = True

            if changed:
                with open(
                    UNIVERSE_FILE,
                    "w",
                    encoding="utf-8",
                ) as f:
                    json.dump(
                        data,
                        f,
                        indent=2,
                        ensure_ascii=False,
                    )

                print()
                print(
                    "Universe JSON updated "
                    "with sector/subsector."
                )

        remaining = db.execute(
            select(Stock).where(Stock.sector.is_(None))
        ).scalars().all()

        print()
        print("=" * 70)
        print(f"Updated stocks          : {updated}")
        print(f"Sector still NULL       : {len(remaining)}")
        print("=" * 70)
        print()

    finally:

        db.close()


if __name__ == "__main__":
    main()