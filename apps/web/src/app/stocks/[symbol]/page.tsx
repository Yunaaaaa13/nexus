"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StockChart, { type Candle } from "@/components/charts/StockChart";
import StockLogo from "@/components/stocks/StockLogo";
import TechnicalPriceChart from "@/components/stocks/TechnicalPriceChart";
import RSIChart from "@/components/stocks/RSIChart";
import MACDChart from "@/components/stocks/MACDChart";
import TechnicalInterpretation from "@/components/stocks/TechnicalInterpretation";
import {
  getStockHistory,
  getStockIndicators,
  getStockIndicatorHistory,
} from "@/lib/api";

const PERIODS = ["1D", "5D", "1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_DAYS: Record<Period, number> = {
  "1D": 1,
  "5D": 5,
  "1M": 21,
  "3M": 63,
  "6M": 126,
  "1Y": 252,
};

interface TechnicalState {
  trend: string;
  moving_average: string;
  momentum: string;
  rsi_state: string;
  macd_state: string;
  volatility_state: string;
}

interface IndicatorData {
  timestamp: string;
  price: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  volatility20: number | null;
  trend: string | null;
  signals?: Record<string, string>;
  technical_state?: TechnicalState;
  data_quality?: string;
  data_points?: number;
}

interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorHistoryPoint {
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  volatility20: number | null;
}

const formatPrice = (val: number | null) => {
  if (val === null || !Number.isFinite(val)) return "—";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatVolume = (val: number | null) => {
  if (val === null || !Number.isFinite(val)) return "—";
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + "B";
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
  return val.toString();
};

const getStateColor = (state: string | null | undefined) => {
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
};

const getTrendRule = (indicators: IndicatorData) => {
  const state = indicators.technical_state?.trend ?? indicators.trend;

  if (state === "Bullish") {
    return "Price > SMA20 > SMA50 > SMA200";
  }

  if (state === "Bearish") {
    return "Price < SMA20 < SMA50 < SMA200";
  }

  if (state === "Insufficient Data") {
    return "SMA20, SMA50, or SMA200 belum lengkap.";
  }

  return "Price belum membentuk struktur SMA yang searah.";
};

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params?.symbol ?? "").toUpperCase();

  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [stockName, setStockName] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("6M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [indicatorsLoading, setIndicatorsLoading] = useState(true);

  const [indicatorHistory, setIndicatorHistory] = useState<IndicatorHistoryPoint[]>([]);
  const [indicatorHistoryLoading, setIndicatorHistoryLoading] = useState(true);

  useEffect(() => {
    async function fetchIndicatorHistory() {
      try {
        setIndicatorHistoryLoading(true);

        const response = await getStockIndicatorHistory(symbol);

        if (response?.success && Array.isArray(response?.data)) {
          setIndicatorHistory(response.data);
        } else {
          setIndicatorHistory([]);
        }
      } catch (error) {
        console.error(
          "Failed to fetch indicator history:",
          error
        );

        setIndicatorHistory([]);
      } finally {
        setIndicatorHistoryLoading(false);
      }
    }

    if (symbol) {
      fetchIndicatorHistory();
    }
  }, [symbol]);

  useEffect(() => {
    async function fetchIndicators() {
      try {
        setIndicatorsLoading(true);

        console.log("Fetching indicators for:", symbol);

        const response = await getStockIndicators(symbol);

        console.log("Indicators API response:", response);

        if (response?.success && response?.data) {
          const payload = response.data;

          // Backend menempatkan nilai indikator di response.data.data
          // (hasil get_stock_indicators: { success, symbol, data, metadata })
          setIndicators(payload.data ?? null);
        } else {
          console.error("Invalid indicators response:", response);
          setIndicators(null);
        }
      } catch (error) {
        console.error("Failed to fetch indicators:", error);
        setIndicators(null);
      } finally {
        setIndicatorsLoading(false);
      }
    }

    if (symbol) {
      fetchIndicators();
    }
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    // Kondisi awal setiap ganti symbol; setState bersifat sinkron di body effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    getStockHistory(symbol)
      .then((res) => {
        if (isMounted && res?.success && res.data) {
          setStockName(res.data.name ?? null);
          setPrices(res.data.prices ?? []);
        } else {
          throw new Error("Gagal memuat data saham.");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat data saham."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const chartCandles: Candle[] = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const window = prices.slice(-days);
    return window.map((p) => ({
      time: p.timestamp.substring(0, 10),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  }, [prices, period]);

  const latest = prices.length > 0 ? prices[prices.length - 1] : null;
  const prev = prices.length > 1 ? prices[prices.length - 2] : null;

  const changeAmount = latest && prev ? latest.close - prev.close : null;
  const changePercent =
    latest && prev && prev.close !== 0
      ? ((latest.close - prev.close) / prev.close) * 100
      : 0;
  const isPositive = (changeAmount ?? 0) >= 0;

  const displayCandle =
    chartCandles.length > 0 ? chartCandles[chartCandles.length - 1] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Stocks" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Back + Header */}
        <div className="mb-6">
          <Link
            href="/stocks"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Stock Explorer
          </Link>
        </div>

        {loading && prices.length === 0 ? (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="mt-4 text-sm text-zinc-400">Memuat data {symbol}...</p>
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <p className="text-base font-semibold text-white">Gagal Memuat Data</p>
            <p className="mt-1 text-sm text-zinc-400">{error}</p>
            <p className="mt-3 text-xs text-zinc-600">
              Pastikan ticker terdaftar dan data historis sudah di-sync ke PostgreSQL.
            </p>
          </section>
        ) : latest ? (
          <>
            {/* Header */}
            <section className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <StockLogo
                      symbol={symbol}
                      name={stockName ?? `${symbol} Tbk.`}
                      size="lg"
                    />
                    <div>
                      <h1 className="text-xl font-semibold tracking-tight text-white">
                        {symbol}
                        <span className="ml-2 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                          .JK
                        </span>
                      </h1>
                      <p className="text-sm text-zinc-400">
                        {stockName || `${symbol} Tbk.`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[34px] font-semibold leading-none tabular-nums tracking-tight text-white">
                      Rp {formatPrice(latest.close)}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "▲" : "▼"}{" "}
                      {changeAmount !== null ? formatPrice(changeAmount) : "0"} (
                      {changePercent > 0 ? "+" : ""}
                      {changePercent.toFixed(2)}%)
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] tabular-nums text-zinc-600">
                    {latest.timestamp ? (
                      <>
                        Updated{" "}
                        {new Date(latest.timestamp).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        WIB
                      </>
                    ) : (
                      "Market Data"
                    )}
                  </p>
                </div>

                {/* Period Selector */}
                <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/40 p-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        period === p
                          ? "bg-white/[0.12] text-white"
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="mt-6 h-[300px] w-full min-w-0">
                <StockChart
                  key={period}
                  candles={chartCandles}
                  positive={isPositive}
                />
              </div>
            </section>

            {/* Price Intelligence */}
            {!indicatorHistoryLoading && indicatorHistory.length > 0 && (
              <section className="mt-8">
                <TechnicalPriceChart data={indicatorHistory} />
              </section>
            )}

            {/* RSI Intelligence */}
            {!indicatorHistoryLoading && indicatorHistory.length > 0 && (
              <section className="mt-6">
                <RSIChart data={indicatorHistory} />
              </section>
            )}

            {/* MACD Intelligence */}
            {!indicatorHistoryLoading && indicatorHistory.length > 0 && (
              <section className="mt-6">
                <MACDChart data={indicatorHistory} />
              </section>
            )}

            {/* OHLCV Stats */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Open" value={`Rp ${formatPrice(displayCandle?.open ?? null)}`} />
              <StatCard label="Day High" value={`Rp ${formatPrice(displayCandle?.high ?? null)}`} positive />
              <StatCard label="Day Low" value={`Rp ${formatPrice(displayCandle?.low ?? null)}`} negative />
              <StatCard label="Volume" value={formatVolume(displayCandle?.volume ?? null)} />
            </section>

            {/* Technical Intelligence */}
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Technical Intelligence</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Technical indicators calculated from historical market data.
                </p>
              </div>

              {indicatorsLoading ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <span className="text-sm text-zinc-400">Loading technical indicators...</span>
                  </div>
                </div>
              ) : indicators ? (
                <>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Trend</span>

                    <p className={`mt-2 text-2xl font-semibold tabular-nums ${getStateColor(
                      indicators.technical_state?.trend ?? indicators.trend
                    )}`}>
                      {indicators.technical_state?.trend ?? indicators.trend ?? "N/A"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      {getTrendRule(indicators)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Momentum</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.momentum
                      )}`}>
                        {indicators.technical_state?.momentum ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">RSI</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.rsi_state
                      )}`}>
                        {indicators.technical_state?.rsi_state ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">MACD</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.macd_state
                      )}`}>
                        {indicators.technical_state?.macd_state ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Moving Avg</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.moving_average
                      )}`}>
                        {indicators.technical_state?.moving_average ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Volatility</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.volatility_state
                      )}`}>
                        {indicators.technical_state?.volatility_state ?? "N/A"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Data</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.data_quality
                      )}`}>
                        {indicators.data_quality ?? "N/A"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-500">
                    Data points: {indicators.data_points ?? "N/A"}
                  </p>

                  <div className="mt-6">
                    <h3 className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">Indicator Snapshot</h3>

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Trend</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.trend
                      )}`}>
                        {indicators.trend ?? "N/A"}
                      </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">RSI 14</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.rsi_state
                      )}`}>
                        {indicators.rsi14?.toFixed(1) ?? "N/A"}
                      </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">MACD</span>
                      <p className={`mt-1 text-lg font-semibold tabular-nums ${getStateColor(
                        indicators.technical_state?.macd_state
                      )}`}>
                        {indicators.macd?.toFixed(1) ?? "N/A"}
                      </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Volatility 20D</span>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-white">
                        {indicators.volatility20?.toFixed(2) ?? "N/A"}%
                      </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">Moving Averages</h3>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                      {[
                        { label: "SMA 20", value: indicators.sma20 },
                        { label: "SMA 50", value: indicators.sma50 },
                        { label: "SMA 200", value: indicators.sma200 },
                        { label: "EMA 20", value: indicators.ema20 },
                        { label: "EMA 50", value: indicators.ema50 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</span>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-white">
                            {item.value !== null
                              ? new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(item.value)
                              : "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-[10px] uppercase tracking-wider text-zinc-500">MACD Detail</h3>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {[
                        { label: "MACD", value: indicators.macd, key: "macd" as const },
                        { label: "Signal", value: indicators.macd_signal, key: "macd_signal" as const },
                        { label: "Histogram", value: indicators.macd_histogram, key: "macd_histogram" as const },
                      ].map((item) => (
                        <div key={item.key}>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</span>
                          <p className={`mt-1 font-semibold tabular-nums ${
                            item.key === "macd_histogram"
                              ? (item.value ?? 0) > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                              : "text-white"
                          }`}>
                            {item.value !== null ? item.value.toFixed(2) : "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <p className="text-sm text-zinc-500">Technical data unavailable.</p>
                </div>
              )}
            </section>

            {/* Technical Interpretation */}
            {indicators && (
              <section className="mt-8">
                <TechnicalInterpretation data={indicators} />
              </section>
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-zinc-400">
            <p className="text-base font-semibold text-white">
              Tidak ada data historis
            </p>
            <p className="mt-1 text-sm">Belum ada harga tersimpan untuk {symbol}.</p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-white/[0.05] py-6">
          <div className="flex flex-col justify-between gap-2 text-[10px] tracking-wider text-zinc-600 md:flex-row">
            <span>NEXUS · INDONESIAN MARKET INTELLIGENCE</span>
            <span>DATA LAYER v0.1 · CONNECTED TO POSTGRESQL</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          positive ? "text-emerald-400" : negative ? "text-rose-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
