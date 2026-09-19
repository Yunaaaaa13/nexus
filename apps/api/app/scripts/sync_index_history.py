from app.database.database import SessionLocal
from app.services.market_data.ingestion import (
    MarketDataIngestionService,
)


def main():
    print()
    print("=" * 60)
    print("NEXUS IHSG HISTORY INGESTION")
    print("=" * 60)

    db = SessionLocal()

    try:
        service = MarketDataIngestionService()

        result = service.sync_index_history(
            db=db,
            symbol="IHSG",
        )

        print()
        print("Result:")

        for key, value in result.items():
            print(f"  {key:<16} : {value}")

        print()
        print("IHSG daily history is ready for benchmarking.")
    except Exception as e:
        db.rollback()
        print()
        print(f"ERROR: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()