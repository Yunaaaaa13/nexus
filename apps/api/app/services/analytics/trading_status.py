from typing import Optional


TRADING_STATUS_ACTIVE = "ACTIVE"
TRADING_STATUS_NO_VOLUME = "NO_VOLUME"
TRADING_STATUS_NO_PRICE_CHANGE = "NO_PRICE_CHANGE"
TRADING_STATUS_INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


def classify_trading_status(
    price: Optional[float],
    volume: Optional[int],
    previous_close: Optional[float],
) -> str:
    """
    Klasifikasi status perdagangan saham berdasarkan data
    harga terbaru vs previous close dan volume.

    - ACTIVE              : volume > 0, harga berubah.
    - NO_VOLUME           : tidak ada transaksi (volume = 0).
    - NO_PRICE_CHANGE     : ada transaksi tapi harga tidak berubah.
    - INSUFFICIENT_DATA   : data harga tidak tersedia cukup.
    """

    if price is None:
        return TRADING_STATUS_INSUFFICIENT_DATA

    volume = volume or 0

    if volume <= 0:
        return TRADING_STATUS_NO_VOLUME

    if previous_close is None:
        return TRADING_STATUS_INSUFFICIENT_DATA

    if float(price) == float(previous_close):
        return TRADING_STATUS_NO_PRICE_CHANGE

    return TRADING_STATUS_ACTIVE