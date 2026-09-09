from sqlalchemy import (
    Integer,
    Numeric,
    BigInteger,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database.database import Base


class StockPrice(Base):
    __tablename__ = "stock_prices"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.id"),
        nullable=False,
        index=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )

    open: Mapped[float] = mapped_column(
        Numeric(18, 4),
        nullable=False
    )

    high: Mapped[float] = mapped_column(
        Numeric(18, 4),
        nullable=False
    )

    low: Mapped[float] = mapped_column(
        Numeric(18, 4),
        nullable=False
    )

    close: Mapped[float] = mapped_column(
        Numeric(18, 4),
        nullable=False
    )

    volume: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        default=0
    )

    source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )