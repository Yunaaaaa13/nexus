"use client";

import { useEffect, useState } from "react";
import { getStockUniverse, runBacktest } from "@/lib/api";

import EquityCurve from "@/components/backtest/EquityCurve";
import TradeHistory from "@/components/backtest/TradeHistory";
import PerformanceComparison from "@/components/backtest/PerformanceComparison";
import StockPickerModal, {
  type StockOption,
} from "@/components/ui/StockPickerModal";

type Trade = {
  type: string;
  timestamp: string;
  price: number;
  shares: number;
  entry_price?: number;
  entry_date?: string;
  pnl?: number;
  return_percent?: number;
  forced_exit?: boolean;
};

type EquityPoint = {
  timestamp: string;
  equity: number;
};

type BenchmarkComparison = {
  benchmark: string;
  strategy_return_percent: number;
  benchmark_return_percent: number;
  excess_return_percent: number;
  benchmark_max_drawdown_percent: number;
  benchmark_volatility_percent: number | null;
  beta: number | null;
  data_points: number;
  curve: {
    timestamp: string;
    strategy: number;
    benchmark: number;
  }[];
};

type BacktestResult = {
  initial_capital: number;
  final_capital: number;
  total_return_percent: number;
  cagr_percent: number;
  max_drawdown_percent: number;
  trade_count: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_percent: number;
  profit_factor: number | null;
  sharpe_ratio: number | null;
  total_fees: number;
  buy_fee_percent: number;
  sell_fee_percent: number;
  slippage_percent: number;
  data_points: number;
  start_date: string | null;
  end_date: string | null;
  benchmark: BenchmarkComparison | null;
  trades: Trade[];
  equity_curve: EquityPoint[];
};

const STRATEGIES = [
  {
    value: "dual_sma",
    label: "Dual SMA",
    description: "SMA20 / SMA50 crossover",
  },
  {
    value: "rsi_momentum",
    label: "RSI Momentum",
    description: "RSI-based momentum strategy",
  },
  {
    value: "bollinger",
    label: "Bollinger Mean Reversion",
    description: "Bollinger Band mean reversion",
  },
];

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export default function BacktestView() {
  const [symbol, setSymbol] = useState("BBCA");

  const [stockList, setStockList] = useState<
    StockOption[]
  >([]);

  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [universeLoading, setUniverseLoading] =
    useState(true);

  const [strategy, setStrategy] =
    useState("dual_sma");

  const [capital, setCapital] =
    useState(100_000_000);

  const [result, setResult] =
    useState<BacktestResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleSymbolChange(
    value: string
  ) {
    setSymbol(value);
    setResult(null);
    setError("");
  }

  // Load the full stock universe once
  useEffect(() => {
    let active = true;

    getStockUniverse({ limit: 1000 })
      .then((res) => {
        if (!active) return;

        setStockList(res.data ?? []);
      })
      .catch((err) => {
        console.error(
          "Failed to load stock list:",
          err
        );
      })
      .finally(() => {
        if (active) {
          setUniverseLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleStrategyChange(
    value: string
  ) {
    setStrategy(value);
    setResult(null);
    setError("");
  }

  function handleCapitalChange(
    value: string
  ) {
    const numericValue = Number(value);

    setCapital(
      Number.isFinite(numericValue)
        ? numericValue
        : 0
    );

    setResult(null);
    setError("");
  }

  async function handleBacktest() {
    if (!symbol) {
      setError("Please select a stock.");
      return;
    }

    if (capital <= 0) {
      setError(
        "Initial capital must be greater than zero."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await runBacktest({
        symbol,
        strategy,
        initial_capital: capital,
      });

      console.log(
        "NEXUS BACKTEST RESULT:",
        response
      );

      setResult(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to run backtest."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedStrategy =
    STRATEGIES.find(
      (item) => item.value === strategy
    );

  const selectedStock = stockList.find(
    (item) => item.symbol === symbol
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
          QUANTITATIVE LAB
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Strategy Backtester
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Test trading strategies against historical
          market data stored in PostgreSQL.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ========================= */}
        {/* SETTINGS */}
        {/* ========================= */}

        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">

          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Strategy Parameters
            </h2>

            <p className="text-xs text-zinc-600">
              Configure the historical simulation.
            </p>
          </div>

          <div className="mt-6 space-y-5">

            {/* Symbol */}
            <div>
              <label className="text-xs text-zinc-400">
                Target Asset
              </label>

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-left transition hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {symbol}
                  </span>

                  {selectedStock &&
                    selectedStock.name !==
                      selectedStock.symbol && (
                      <span className="truncate text-xs text-zinc-500">
                        {selectedStock.name}
                      </span>
                    )}
                </div>

                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 shrink-0 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 4.5L6 8l3.5-3.5" />
                </svg>
              </button>

              <p className="mt-1.5 text-[11px] text-zinc-600">
                {universeLoading
                  ? "Loading stock universe..."
                  : `${stockList.length.toLocaleString(
                      "id-ID"
                    )} stocks available · click to select`}
              </p>
            </div>

            {/* Strategy */}
            <div>
              <label className="text-xs text-zinc-400">
                Strategy
              </label>

              <select
                value={strategy}
                onChange={(e) =>
                  handleStrategyChange(
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20"
              >
                {STRATEGIES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-[11px] text-zinc-600">
                {selectedStrategy?.description}
              </p>
            </div>

            {/* Capital */}
            <div>
              <label className="text-xs text-zinc-400">
                Initial Capital
              </label>

              <input
                type="number"
                min="1"
                step="1000000"
                value={capital}
                onChange={(e) =>
                  handleCapitalChange(
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/20"
              />

              <p className="mt-1.5 text-[11px] text-zinc-600">
                {capital > 0
                  ? formatCurrency(capital)
                  : "Invalid capital"}
              </p>
            </div>

            {/* Run */}
            <button
              onClick={handleBacktest}
              disabled={loading}
              className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Running Simulation..."
                : "Run Simulation"}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-rose-400">
                  {error}
                </p>
              </div>
            )}

            {/* Method note */}
            <div className="border-t border-white/[0.05] pt-4">
              <p className="text-[10px] leading-relaxed text-zinc-600">
                Results are calculated from historical
                price data available in the NEXUS
                PostgreSQL database.
              </p>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* RESULTS */}
        {/* ========================= */}

        <div className="space-y-4 lg:col-span-2">

          {!result && !loading && (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-zinc-950 px-6 text-center">

              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                No Backtest Yet
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Select an asset and strategy,
                then run a simulation.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-[104px] animate-pulse rounded-xl border border-white/[0.06] bg-zinc-900/60"
                />
              ))}
            </div>
          )}

          {result && (
            <>
              {/* ========================= */}
              {/* RESULT HEADER */}
              {/* ========================= */}

              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    Simulation Result
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {symbol} ·{" "}
                    {selectedStrategy?.label}
                  </h2>
                </div>

                <div className="text-xs text-zinc-600">
                  {result.data_points} historical
                  data points
                </div>
              </div>

              {/* Period */}
              <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                <span>
                  Period:{" "}
                  <span className="text-zinc-300">
                    {result.start_date
                      ? new Date(
                          result.start_date
                        ).toLocaleDateString("id-ID")
                      : "--"}
                    {" → "}
                    {result.end_date
                      ? new Date(
                          result.end_date
                        ).toLocaleDateString("id-ID")
                      : "--"}
                  </span>
                </span>

                <span>
                  Data points:{" "}
                  <span className="text-zinc-300">
                    {result.data_points}
                  </span>
                </span>
              </div>

              {/* ========================= */}
              {/* STRATEGY SUMMARY */}
              {/* ========================= */}

              <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Strategy Summary
                    </p>

                    <h3 className="mt-1 text-base font-semibold text-white">
                      {symbol} ·{" "}
                      {selectedStrategy?.label}
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      {selectedStrategy?.description}
                    </p>
                  </div>

                  <div className="text-right text-[11px] leading-6 text-zinc-500">
                    <p>
                      Initial capital:{" "}
                      <span className="text-zinc-300">
                        {formatCurrency(
                          result.initial_capital
                        )}
                      </span>
                    </p>

                    <p>
                      Final capital:{" "}
                      <span className="text-zinc-300">
                        {formatCurrency(
                          result.final_capital
                        )}
                      </span>
                    </p>

                    <p>
                      Costs:{" "}
                      <span className="text-zinc-300">
                        buy{" "}
                        {result.buy_fee_percent}% ·
                        sell{" "}
                        {result.sell_fee_percent}% ·
                        slippage{" "}
                        {result.slippage_percent}%
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
                  Backtest adalah evaluasi historis
                  menggunakan{" "}
                  {result.data_points} data points.
                  Hasil tidak menjamin performa masa
                  depan.
                </p>
              </div>

              {/* ========================= */}
              {/* KPI */}
              {/* ========================= */}

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

                {/* Return */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Total Return
                  </span>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      result.total_return_percent >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatPercent(
                      result.total_return_percent
                    )}
                  </p>
                </div>

                {/* Final Capital */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Final Capital
                  </span>

                  <p className="mt-1 text-lg font-bold text-white">
                    {formatCurrency(
                      result.final_capital
                    )}
                  </p>
                </div>

                {/* Win Rate */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Win Rate
                  </span>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.win_rate_percent.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>

                {/* Max Drawdown */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Max Drawdown
                  </span>

                  <p className="mt-1 text-2xl font-bold text-rose-400">
                    {result.max_drawdown_percent.toFixed(
                      2
                    )}
                    %
                  </p>
                </div>

                {/* Trades */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Completed Trades
                  </span>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.trade_count}
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    {result.winning_trades} wins ·{" "}
                    {result.losing_trades} losses
                  </p>
                </div>

                {/* Profit Factor */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Profit Factor
                  </span>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.profit_factor !== null
                      ? result.profit_factor.toFixed(
                          2
                        )
                      : "--"}
                  </p>
                </div>

                {/* CAGR */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    CAGR
                  </span>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.cagr_percent > 0
                      ? "+"
                      : ""}
                    {result.cagr_percent.toFixed(2)}%
                  </p>
                </div>

                {/* Sharpe Ratio */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Sharpe Ratio
                  </span>

                  <p className="mt-1 text-2xl font-bold text-white">
                    {result.sharpe_ratio !== null
                      ? result.sharpe_ratio.toFixed(
                          2
                        )
                      : "--"}
                  </p>
                </div>

                {/* Total Fees */}
                <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Total Fees
                  </span>

                  <p className="mt-1 text-lg font-bold text-white">
                    {formatCurrency(
                      result.total_fees
                    )}
                  </p>
                </div>
              </div>

              {/* ========================= */}
              {/* BENCHMARK KPI */}
              {/* ========================= */}

              {result.benchmark && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {/* Excess Return */}
                  <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Excess Return vs IHSG
                    </span>

                    <p
                      className={`mt-1 text-2xl font-bold ${
                        result.benchmark.excess_return_percent >=
                        0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatPercent(
                        result.benchmark
                          .excess_return_percent
                      )}
                    </p>
                  </div>

                  {/* Benchmark Return */}
                  <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      IHSG Return
                    </span>

                    <p
                      className={`mt-1 text-2xl font-bold ${
                        result.benchmark
                          .benchmark_return_percent >=
                        0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatPercent(
                        result.benchmark
                          .benchmark_return_percent
                      )}
                    </p>
                  </div>

                  {/* Benchmark Max Drawdown */}
                  <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      IHSG Max Drawdown
                    </span>

                    <p className="mt-1 text-2xl font-bold text-rose-400">
                      {result.benchmark.benchmark_max_drawdown_percent.toFixed(
                        2
                      )}
                      %
                    </p>
                  </div>

                  {/* Beta */}
                  <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Beta vs IHSG
                    </span>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {result.benchmark.beta !== null
                        ? result.benchmark.beta.toFixed(
                            2
                          )
                        : "--"}
                    </p>
                  </div>

                  {/* Benchmark Volatility */}
                  <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      IHSG Volatility
                    </span>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {result.benchmark.benchmark_volatility_percent !==
                      null
                        ? result.benchmark.benchmark_volatility_percent.toFixed(
                            1
                          ) + "%"
                        : "--"}
                    </p>
                  </div>
                </div>
              )}

              {/* ========================= */}
              {/* EQUITY CURVE */}
              {/* ========================= */}

              <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Simulation Equity Curve
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Portfolio value throughout the
                      historical simulation.
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Final Capital
                    </p>

                    <p className="mt-0.5 text-sm font-medium text-white">
                      {formatCurrency(
                        result.final_capital
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <EquityCurve
                    data={result.equity_curve}
                  />
                </div>
              </div>

              {/* ========================= */}
              {/* BENCHMARK COMPARISON */}
              {/* ========================= */}

              {result.benchmark && (
                <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        vs {result.benchmark.benchmark}{" "}
                        Benchmark
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Cumulative performance, re-based
                        to 100 at period start.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: "#a78bfa",
                          }}
                        />
                        {selectedStrategy?.label}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: "#a1a1aa",
                          }}
                        />
                        IHSG
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <PerformanceComparison
                      data={result.benchmark.curve}
                    />
                  </div>
                </div>
              )}

              {/* ========================= */}
              {/* TRADE HISTORY */}
              {/* ========================= */}

              <TradeHistory
                trades={result.trades}
              />
            </>
          )}
        </div>
      </div>

      <StockPickerModal
        open={pickerOpen}
        stocks={stockList}
        loading={universeLoading}
        selectedSymbol={symbol}
        onSelect={(stock) => {
          handleSymbolChange(stock.symbol);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}