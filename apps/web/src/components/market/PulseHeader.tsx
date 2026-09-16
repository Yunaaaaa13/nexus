"use client";

interface PulseHeaderProps {
  latestPrice: number | null;
  change: number | null;
  changePercent: number | null;
  marketStatus: "Open" | "Closed" | null;
  loading: boolean;
}

const formatNumber = (value: number | null, digits = 2) => {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export default function PulseHeader({
  latestPrice,
  change,
  changePercent,
  marketStatus,
  loading,
}: PulseHeaderProps) {
  const isPositive = (change ?? 0) >= 0;
  const sign = isPositive ? "+" : "−";

  const changeText =
    change !== null && Number.isFinite(change)
      ? `${sign}${Math.abs(change).toLocaleString("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";

  const percentText =
    changePercent !== null && Number.isFinite(changePercent)
      ? `${changePercent >= 0 ? "+" : "−"}${Math.abs(changePercent).toLocaleString(
          "id-ID",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}%`
      : "—";

  return (
    <header className="px-6 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
          Market Pulse
        </span>
        <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] px-2.5 py-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              marketStatus === "Open"
                ? "animate-pulse bg-emerald-400"
                : "bg-amber-400/80"
            }`}
          />
          <span className="text-[11px] font-medium text-zinc-300">
            {marketStatus === "Open"
              ? "Market Open"
              : marketStatus === "Closed"
              ? "Market Closed"
              : "—"}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          IHSG Composite
        </h1>
        <span className="text-[11px] font-medium tracking-[0.16em] text-zinc-600">
          IDX · BEI
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {loading ? (
          <div className="h-8 w-44 animate-pulse rounded bg-white/[0.05]" />
        ) : (
          <>
            <span className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-white">
              {formatNumber(latestPrice)}
            </span>
            <span
              className={`text-sm font-medium tabular-nums ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? "▲" : "▼"} {changeText} ({percentText})
            </span>
          </>
        )}
      </div>
    </header>
  );
}