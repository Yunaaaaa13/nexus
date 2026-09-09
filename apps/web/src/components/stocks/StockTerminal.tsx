"use client";

import { useState, useEffect } from "react";
import { getStockHistory } from "@/lib/api";

interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const POPULAR_STOCKS = ["BBCA", "BBRI", "BMRI", "TLKM", "ASII", "ANTM", "GOTO"];

export default function StockTerminal() {
  const [selectedStock, setSelectedStock] = useState("BBCA");
  const [period, setPeriod] = useState<"1D" | "1W" | "1M" | "6M" | "1Y">("1Y");
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getStockHistory(selectedStock)
      .then((res) => {
        if (isMounted && res?.data?.prices) {
          setPrices(res.data.prices);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load stored market data");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStock]);

  // Filter prices based on period
  const filteredPrices = (() => {
    if (!prices.length) return [];
    if (period === "1D") return prices.slice(-1);
    if (period === "1W") return prices.slice(-5);
    if (period === "1M") return prices.slice(-21);
    if (period === "6M") return prices.slice(-126);
    return prices;
  })();

  const latestPrice = prices.length ? prices[prices.length - 1] : null;
  const prevPrice = prices.length > 1 ? prices[prices.length - 2] : null;

  const change = latestPrice && prevPrice ? latestPrice.close - prevPrice.close : 0;
  const changePercent = prevPrice && prevPrice.close ? (change / prevPrice.close) * 100 : 0;
  const isPositive = change >= 0;

  // SVG Chart path calculation
  const chartPoints = (() => {
    if (filteredPrices.length < 2) return "";
    const min = Math.min(...filteredPrices.map((p) => p.close));
    const max = Math.max(...filteredPrices.map((p) => p.close));
    const range = max - min || 1;
    const width = 800;
    const height = 220;
    const padding = 20;

    return filteredPrices
      .map((p, i) => {
        const x = (i / (filteredPrices.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((p.close - min) / range) * (height - padding * 2) - padding;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  })();

  return (
    <div className="space-y-6">
      {/* Top Bar: Stock Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-zinc-500">TICKER:</span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_STOCKS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedStock(sym)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedStock === sym
                    ? "bg-white text-black shadow-sm"
                    : "border border-white/[0.08] text-zinc-400 hover:border-white/[0.15] hover:text-white"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-400">PostgreSQL Data Layer</span>
        </div>
      </div>

      {/* Main Stock Card */}
      <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
                INDONESIAN EQUITY
              </span>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                IDX · {selectedStock}.JK
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-white">
              {selectedStock} · PT Bank Central Asia Tbk
            </h1>

            <div className="mt-3 flex items-baseline gap-4">
              <span className="text-4xl font-bold md:text-5xl text-white">
                Rp {latestPrice ? latestPrice.close.toLocaleString("id-ID") : "6,525"}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "▲" : "▼"} {Math.abs(change).toLocaleString("id-ID")} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/40 p-1">
            {(["1D", "1W", "1M", "6M", "1Y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  period === p
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-black/30 p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
            <span>OHLCV Daily Historical Trend</span>
            <span>{filteredPrices.length} candles in range</span>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
              Loading stored data from PostgreSQL...
            </div>
          ) : error ? (
            <div className="flex h-56 flex-col items-center justify-center text-sm text-zinc-500">
              <p className="text-red-400">{error}</p>
              <p className="mt-1 text-xs text-zinc-600">Please make sure FastAPI server is running on :8000</p>
            </div>
          ) : chartPoints ? (
            <div className="relative h-56 w-full">
              <svg viewBox="0 0 800 220" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <path
                  d={chartPoints}
                  fill="none"
                  stroke={isPositive ? "#10b981" : "#f43f5e"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
              No historical data available.
            </div>
          )}
        </div>

        {/* OHLCV Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 p-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Open</span>
            <p className="mt-1 text-lg font-semibold text-white">
              Rp {latestPrice ? latestPrice.open.toLocaleString("id-ID") : "6,700"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 p-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Day High</span>
            <p className="mt-1 text-lg font-semibold text-emerald-400">
              Rp {latestPrice ? latestPrice.high.toLocaleString("id-ID") : "6,700"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 p-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Day Low</span>
            <p className="mt-1 text-lg font-semibold text-red-400">
              Rp {latestPrice ? latestPrice.low.toLocaleString("id-ID") : "6,500"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-zinc-900/50 p-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Volume</span>
            <p className="mt-1 text-lg font-semibold text-white">
              {latestPrice ? (latestPrice.volume / 1_000_000).toFixed(1) + "M" : "139.3M"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
