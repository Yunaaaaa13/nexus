from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.backtesting.data import (
    get_backtest_data,
    get_index_data,
)

from app.services.backtesting.engine import (
    run_backtest,
)

from app.services.backtesting.benchmark import (
    compute_benchmark_comparison,
)


router = APIRouter(
    prefix="/api/backtest",
    tags=["Backtesting"],
)


@router.get("")
def backtest(
    symbol: str = Query(...),

    strategy: str = Query(
        "dual_sma"
    ),

    initial_capital: float = Query(
        100_000_000,
        gt=0,
    ),

    start_date: str | None = Query(
        None
    ),

    end_date: str | None = Query(
        None
    ),

    buy_fee_percent: float = Query(
        0.0,
        ge=0,
    ),

    sell_fee_percent: float = Query(
        0.0,
        ge=0,
    ),

    slippage_percent: float = Query(
        0.0,
        ge=0,
    ),

    db: Session = Depends(get_db),
):

    try:

        data = get_backtest_data(
            db=db,
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
        )

        if data.empty:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No historical data "
                    f"found for {symbol.upper()}"
                ),
            )

        result = run_backtest(
            df=data,
            initial_capital=initial_capital,
            strategy=strategy,
            buy_fee_percent=buy_fee_percent,
            sell_fee_percent=sell_fee_percent,
            slippage_percent=slippage_percent,
        )

        index_data = get_index_data(
            db=db,
            symbol="IHSG",
            start_date=start_date,
            end_date=end_date,
        )

        benchmark_comparison = None

        if not index_data.empty:

            benchmark_comparison = (
                compute_benchmark_comparison(
                    equity_curve=result["equity_curve"],
                    index_df=index_data,
                )
            )

        result["benchmark"] = benchmark_comparison

        return {
            "success": True,
            "symbol": symbol.upper(),
            "strategy": strategy,
            "data": result,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )