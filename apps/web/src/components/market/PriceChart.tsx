"use client";

import IndexAreaChart, { type Candle } from "./IndexAreaChart";

export const PERIODS = [
  "1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "ALL",
] as const;
export type Period = (typeof PERIODS)[number];

interface PriceChartProps {
  candles: Candle[];
  interval: string;
  positive: boolean;
  period: Period;
  onPeriodChange: (p: Period) => void;
  loading: boolean;
  onRetry?: () => void;
}

export default function PriceChart({
  candles,
  interval,
  positive,
  period,
  onPeriodChange,
  loading,
  onRetry,
}: PriceChartProps) {
  return (
    <div className="min-w-0 w-full">
      <div className="h-[260px] min-w-0 w-full">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-1/2 w-11/12 animate-pulse rounded-lg bg-white/[0.04]" />
          </div>
        ) : candles.length > 0 ? (
          <IndexAreaChart
            key={period}
            candles={candles}
            interval={interval}
            positive={positive}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center gap-2 text-xs text-red-400">
            <span>Failed to load chart data</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded border border-white/[0.08] px-2.5 py-1 text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-x-1 px-6 pt-3 pb-5">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
              period === p
                ? "border border-white/[0.10] bg-white/[0.06] text-zinc-100"
                : "border border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
