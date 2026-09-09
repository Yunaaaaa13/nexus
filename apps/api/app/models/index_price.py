from sqlalchemy import (
    Numeric,
    BigInteger,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.database.database import Base


class IndexPrice(Base):
    __tablename__ = "index_prices"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    index_id: Mapped[int] = mapped_column(
        ForeignKey("indices.id"),
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

    change: Mapped[float | None] = mapped_column(
        Numeric(18, 4),
        nullable=True
    )

    change_percent: Mapped[float | None] = mapped_column(
        Numeric(10, 4),
        nullable=True
    )

    source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )
