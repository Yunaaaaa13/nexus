from datetime import datetime

import yfinance as yf
from sqlalchemy import select

from app.database.database import SessionLocal
from app.models.stock import Stock
from app.models.stock_price import StockPrice
from app.scripts.stock_universe import STOCK_UNIVERSE


def normalize_timestamp(timestamp):
    """
    Convert Yahoo Finance timestamp into a naive datetime
    suitable for PostgreSQL TIMESTAMP.
    """
    if hasattr(timestamp, "tzinfo") and timestamp.tzinfo is not None:
        timestamp = timestamp.tz_convert("Asia/Jakarta")
        timestamp = timestamp.tz_localize(None)

    return timestamp.to_pydatetime()


def ingest_stock(
    db,
    stock_config,
):
    symbol = stock_config["symbol"]

    print(f"\n[{symbol}] Fetching historical data...")

    ticker = yf.Ticker(f"{symbol}.JK")

    history = ticker.history(
        period="1y",
        interval="1d",
        auto_adjust=False,
    )

    if history.empty:
        print(f"[{symbol}] No data found. Skipping.")
        return 0

    # Find or create stock
    stock = db.execute(
        select(Stock).where(
            Stock.symbol == symbol
        )
    ).scalar_one_or_none()

    if stock is None:
        stock = Stock(
            symbol=symbol,
            name=stock_config["name"],
            sector=stock_config["sector"],
        )

        db.add(stock)
        db.flush()

        print(f"[{symbol}] Created stock record.")

    else:
        # Keep metadata updated
        stock.name = stock_config["name"]
        stock.sector = stock_config["sector"]

    inserted = 0

    for timestamp, row in history.iterrows():

        if (
            row["Open"] is None
            or row["High"] is None
            or row["Low"] is None
            or row["Close"] is None
        ):
            continue

        normalized_timestamp = normalize_timestamp(
            timestamp
        )

        # Prevent duplicate records
        existing = db.execute(
            select(StockPrice).where(
                StockPrice.stock_id == stock.id,
                StockPrice.timestamp == normalized_timestamp,
            )
        ).scalar_one_or_none()

        if existing:
            continue

        price = StockPrice(
            stock_id=stock.id,
            timestamp=normalized_timestamp,
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=int(row["Volume"])
            if row["Volume"] is not None
            else 0,
            source="Yahoo Finance",
        )

        db.add(price)
        inserted += 1

    db.commit()

    print(
        f"[{symbol}] "
        f"Downloaded: {len(history)} rows | "
        f"Inserted: {inserted} rows"
    )


def main():
    db = SessionLocal()

    try:
        print("=" * 60)
        print("NEXUS STOCK INGESTION")
        print("=" * 60)

        print(
            f"Stocks to process: "
            f"{len(STOCK_UNIVERSE)}"
        )

        for stock_config in STOCK_UNIVERSE:
            try:
                ingest_stock(
                    db,
                    stock_config,
                )

            except Exception as e:
                db.rollback()

                print(
                    f"[{stock_config['symbol']}] "
                    f"ERROR: {e}"
                )

        print("\n")
        print("=" * 60)
        print("INGESTION COMPLETE")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    main()