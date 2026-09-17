"use client";

type TechnicalState = {
  trend: string;
  moving_average: string;
  momentum: string;
  rsi_state: string;
  macd_state: string;
  volatility_state: string;
};

type TechnicalInterpretationProps = {
  data: {
    price: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    rsi14: number | null;
    macd: number | null;
    macd_signal: number | null;
    macd_histogram: number | null;
    volatility20: number | null;
    trend: string | null;
    technical_state?: TechnicalState;
    data_quality?: string;
    data_points?: number;
  };
};

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });
}

function getStateColor(state: string | null | undefined) {
  if (
    state === "Bullish" ||
    state === "Positive" ||
    state === "Low" ||
    state === "Sufficient" ||
    state === "Improving"
  ) {
    return "text-emerald-400";
  }

  if (
    state === "Bearish" ||
    state === "Negative" ||
    state === "High" ||
    state === "Insufficient" ||
    state === "Weakening"
  ) {
    return "text-rose-400";
  }

  if (
    state === "Overbought" ||
    state === "Oversold" ||
    state === "Limited" ||
    state === "Mixed" ||
    state === "Moderate"
  ) {
    return "text-amber-300";
  }

  return "text-white";
}

function getTrendRule(data: TechnicalInterpretationProps["data"]) {
  const trend = data.technical_state?.trend ?? data.trend;

  if (trend === "Bullish") {
    return "Price > SMA20 > SMA50 > SMA200";
  }

  if (trend === "Bearish") {
    return "Price < SMA20 < SMA50 < SMA200";
  }

  if (trend === "Insufficient Data") {
    return "SMA20, SMA50, atau SMA200 belum lengkap.";
  }

  return "Price belum membentuk struktur SMA yang searah.";
}

export default function TechnicalInterpretation({
  data,
}: TechnicalInterpretationProps) {
  const state = data.technical_state;
  const trend = state?.trend ?? data.trend ?? "N/A";

  const stateItems = [
    {
      label: "Momentum",
      value: state?.momentum ?? "N/A",
      detail: "RSI + MACD composite",
    },
    {
      label: "RSI",
      value: state?.rsi_state ?? "N/A",
      detail: `RSI14 ${formatNumber(data.rsi14)}`,
    },
    {
      label: "MACD",
      value: state?.macd_state ?? "N/A",
      detail: `MACD ${formatNumber(data.macd)}`,
    },
    {
      label: "Moving Avg",
      value: state?.moving_average ?? "N/A",
      detail: "Price vs SMA20/50/200",
    },
    {
      label: "Volatility",
      value: state?.volatility_state ?? "N/A",
      detail: `${formatNumber(data.volatility20)}% annualized`,
    },
    {
      label: "Data",
      value: data.data_quality ?? "N/A",
      detail: `${data.data_points ?? "N/A"} data points`,
    },
  ];

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">
          Technical State
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Backend-generated technical state from latest indicators.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Trend
        </p>

        <p className={`mt-2 text-2xl font-semibold ${getStateColor(trend)}`}>
          {trend}
        </p>

        <p className="mt-2 text-sm text-zinc-500">
          {getTrendRule(data)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stateItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>

            <p className={`mt-2 text-lg font-semibold ${getStateColor(item.value)}`}>
              {item.value}
            </p>

            <p className="mt-2 text-xs text-zinc-500">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
