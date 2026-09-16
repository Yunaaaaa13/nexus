"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StockChart, { type Candle } from "@/components/charts/StockChart";
import { getStockHistory } from "@/lib/api";

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

interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params?.symbol ?? "").toUpperCase();

  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [stockName, setStockName] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("6M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-950 font-bold text-white">
                      {symbol.slice(0, 2)}
                    </span>
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

            {/* OHLCV Stats */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Open" value={`Rp ${formatPrice(displayCandle?.open ?? null)}`} />
              <StatCard label="Day High" value={`Rp ${formatPrice(displayCandle?.high ?? null)}`} positive />
              <StatCard label="Day Low" value={`Rp ${formatPrice(displayCandle?.low ?? null)}`} negative />
              <StatCard label="Volume" value={formatVolume(displayCandle?.volume ?? null)} />
            </section>
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