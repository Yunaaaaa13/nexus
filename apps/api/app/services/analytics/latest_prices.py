from sqlalchemy import text
from sqlalchemy.orm import Session


def get_latest_two_prices(db: Session):
    """
    Mengambil maksimal 2 harga terbaru untuk setiap saham
    dalam satu query database yang efisien.

    Menggunakan LATERAL join agar PostgreSQL hanya membaca
    2 baris terakhir per saham dari index (stock_id, timestamp),
    tanpa harus scan seluruh tabel stock_prices.

    Return:
        [
            {
                "stock_id": ...,
                "symbol": ...,
                "name": ...,
                "sector": ...,
                "timestamp": ...,
                "open": ...,
                "high": ...,
                "low": ...,
                "close": ...,
                "volume": ...,
            }
        ]
        (baris pertama per stock = harga terbaru)
    """

    query = text(
        """
        SELECT
            s.id AS stock_id,
            s.symbol,
            s.name,
            s.sector,
            lp.timestamp,
            lp.open,
            lp.high,
            lp.low,
            lp.close,
            lp.volume
        FROM stocks s
        JOIN LATERAL (
            SELECT
                sp.timestamp,
                sp.open,
                sp.high,
                sp.low,
                sp.close,
                sp.volume
            FROM stock_prices sp
            WHERE sp.stock_id = s.id
            ORDER BY sp.timestamp DESC
            LIMIT 2
        ) lp ON true
        ORDER BY s.symbol
        """
    )

    rows = db.execute(query).all()

    return rows