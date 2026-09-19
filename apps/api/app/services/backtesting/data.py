from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd


def _build_date_sql(
    start_date: str | None,
    end_date: str | None,
):
    filters = []

    if start_date:
        filters.append(
            "timestamp >= CAST(:start_date AS timestamp)"
        )

    if end_date:
        filters.append(
            "timestamp <= CAST(:end_date AS timestamp)"
        )

    return "\n          AND ".join(filters)


def get_index_data(
    db: Session,
    symbol: str = "IHSG",
    start_date: str | None = None,
    end_date: str | None = None,
):
    date_sql = _build_date_sql(
        start_date,
        end_date,
    )

    query = text(f"""
        SELECT
            ip.timestamp,
            ip.open,
            ip.high,
            ip.low,
            ip.close
        FROM index_prices ip
        JOIN indices i
            ON i.id = ip.index_id
        WHERE (i.symbol = :symbol OR i.name = :symbol)
          AND {date_sql if date_sql else 'TRUE'}
        ORDER BY ip.timestamp ASC
    """)

    params = {
        "symbol": symbol.upper().strip(),
    }

    if start_date:
        params["start_date"] = start_date

    if end_date:
        params["end_date"] = end_date

    rows = db.execute(
        query,
        params,
    ).mappings().all()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)

    numeric_columns = [
        "open",
        "high",
        "low",
        "close",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    df["timestamp"] = pd.to_datetime(
        df["timestamp"]
    )

    df = (
        df.dropna(subset=["close"])
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    return df


def get_backtest_data(
    db: Session,
    symbol: str,
    start_date: str | None = None,
    end_date: str | None = None,
):
    date_sql = _build_date_sql(
        start_date,
        end_date,
    )

    query = text(f"""
        SELECT
            sp.timestamp,
            sp.open,
            sp.high,
            sp.low,
            sp.close,
            sp.volume
        FROM stock_prices sp
        JOIN stocks s
            ON s.id = sp.stock_id
        WHERE s.symbol = :symbol
          AND {date_sql if date_sql else 'TRUE'}
        ORDER BY sp.timestamp ASC
    """)

    params = {
        "symbol": symbol.upper().strip(),
    }

    if start_date:
        params["start_date"] = start_date

    if end_date:
        params["end_date"] = end_date

    rows = db.execute(
        query,
        params,
    ).mappings().all()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)

    numeric_columns = [
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    df["timestamp"] = pd.to_datetime(
        df["timestamp"]
    )

    df = (
        df.dropna(subset=["close"])
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    return df