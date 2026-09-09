"use client";

import { useEffect, useMemo, useState } from "react";
import { getIndex } from "@/lib/api";

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  source: string;
}

interface ChartPoint {
  price: number;
  time: string;
}

export default function MarketPulse() {
  const [data, setData] = useState<IndexData | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function loadMarketData() {
    try {
      const response = await getIndex("IHSG");

      const newData: IndexData = response.data;

      setData(newData);

      setChartData((previous) => {
        const point: ChartPoint = {
          price: newData.price,
          time: newData.timestamp,
        };

        const updated = [...previous, point];

        // Simpan maksimal 30 titik
        return updated.slice(-30);
      });

      setLastUpdated(newData.timestamp);
    } catch (error) {
      console.error("Failed to load IHSG:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarketData();

    // Poll backend setiap 30 detik
    const interval = setInterval(() => {
      loadMarketData();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const chart = useMemo(() => {
    if (chartData.length < 2) {
      return null;
    }

    const width = 700;
    const height = 220;

    const prices = chartData.map((point) => point.price);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const range =
      maxPrice - minPrice === 0
        ? 1
        : maxPrice - minPrice;

    const points = chartData.map((point, index) => {
      const x =
        (index / (chartData.length - 1)) * width;

      const y =
        height -
        ((point.price - minPrice) / range) * height;

      return `${x},${y}`;
    });

    const latest = chartData[chartData.length - 1];

    return {
      points: points.join(" "),
      latestPrice: latest.price,
      minPrice,
      maxPrice,
    };
  }, [chartData]);

  const formattedPrice = data
    ? data.price.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";

  const formattedUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(
        "id-ID",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }
      )
    : "—";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 md:p-8">

      {/* Background glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

          <div>

            <div className="flex items-center gap-3">

              <span className="text-xs font-semibold tracking-[0.22em] text-zinc-500">
                MARKET PULSE
              </span>

              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium tracking-wider text-zinc-500">
                IDX
              </span>

            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Indonesian Market
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Monitor the Indonesian equity market through
              real-time market intelligence.
            </p>

          </div>

          {/* Market Status */}
          <div className="flex items-center gap-2 self-start rounded-full border border-white/[0.07] bg-black/30 px-3 py-2">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-xs text-zinc-400">
              Delayed Market Data
            </span>

          </div>

        </div>

        {/* Main Market Area */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:items-end">

          {/* IHSG Info */}
          <div>

            <p className="text-xs font-medium tracking-[0.2em] text-zinc-600">
              IHSG
            </p>

            {loading ? (

              <div className="mt-4 h-16 w-64 animate-pulse rounded-xl bg-white/[0.05]" />

            ) : data ? (

              <>
                <div className="mt-2 flex flex-wrap items-end gap-4">

                  <span className="text-5xl font-semibold tracking-tight md:text-6xl">
                    {formattedPrice}
                  </span>

                  <span className="mb-2 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                    Market
                  </span>

                </div>

                <div className="mt-4 space-y-1">

                  <p className="text-xs text-zinc-500">
                    IDX Composite
                  </p>

                  <p className="text-[11px] text-zinc-700">
                    Last update {formattedUpdated} WIB
                  </p>

                </div>
              </>

            ) : (

              <div className="mt-4">
                <p className="text-sm text-red-400">
                  Unable to load IHSG data
                </p>

                <button
                  onClick={loadMarketData}
                  className="mt-3 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
                >
                  Retry
                </button>
              </div>

            )}

          </div>

          {/* Chart */}
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/[0.05] bg-black/20">

            {/* Chart Header */}
            <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">

              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                  IHSG Intraday Monitor
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  30 latest observations
                </p>
              </div>

              <div className="flex items-center gap-2">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] text-zinc-600">
                  Auto refresh 30s
                </span>

              </div>

            </div>

            {/* Grid */}
            <div className="absolute inset-0 opacity-30">

              <div className="absolute left-0 right-0 top-1/4 border-t border-white/[0.05]" />

              <div className="absolute left-0 right-0 top-1/2 border-t border-white/[0.05]" />

              <div className="absolute left-0 right-0 top-3/4 border-t border-white/[0.05]" />

              <div className="absolute bottom-0 left-1/4 top-0 border-l border-white/[0.04]" />

              <div className="absolute bottom-0 left-1/2 top-0 border-l border-white/[0.04]" />

              <div className="absolute bottom-0 left-3/4 top-0 border-l border-white/[0.04]" />

            </div>

            {/* SVG Chart */}
            <div className="absolute bottom-0 left-0 right-0 top-0 px-3 pb-3 pt-16">

              {chart ? (

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >

                  {/* Area */}
                  <polygon
                    points={`0,220 ${chart.points} 700,220`}
                    fill="currentColor"
                    className="text-emerald-400/[0.03]"
                  />

                  {/* Line */}
                  <polyline
                    points={chart.points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    className="text-emerald-400"
                  />

                  {/* Latest point */}
                  <circle
                    cx="700"
                    cy={
                      220 -
                      ((chart.latestPrice -
                        chart.minPrice) /
                        (chart.maxPrice -
                          chart.minPrice || 1)) *
                        220
                    }
                    r="4"
                    fill="currentColor"
                    className="text-emerald-400"
                  />

                </svg>

              ) : (

                <div className="flex h-full items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto mb-3 h-2 w-2 animate-pulse rounded-full bg-zinc-600" />

                    <p className="text-xs text-zinc-600">
                      Collecting market observations...
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-700">
                      Chart will update automatically
                    </p>

                  </div>

                </div>

              )}

            </div>

            {/* Price labels */}
            {chart && (
              <div className="pointer-events-none absolute bottom-4 right-4 top-16 flex flex-col justify-between text-[9px] text-zinc-700">

                <span>
                  {chart.maxPrice.toLocaleString(
                    "id-ID",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                </span>

                <span>
                  {(
                    (chart.maxPrice +
                      chart.minPrice) /
                    2
                  ).toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </span>

                <span>
                  {chart.minPrice.toLocaleString(
                    "id-ID",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                </span>

              </div>
            )}

          </div>

        </div>

      </div>

    </section>
  );
}