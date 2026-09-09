"use client";

import { useEffect, useMemo, useState } from "react";
import { getIndexIntraday } from "@/lib/api";

interface IntradayCandle {
  time: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IntradayResponse {
  symbol: string;
  name: string;
  session_date: string;
  market_status: "Open" | "Closed";
  latest_price: number;
  open_price: number;
  high_price: number;
  low_price: number;
  change: number;
  change_percent: number;
  last_updated: string;
  last_updated_time: string;
  candles_count: number;
  candles: IntradayCandle[];
  source: string;
}

export default function MarketPulse() {
  const [data, setData] = useState<IntradayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<IntradayCandle | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  async function loadMarketData() {
    try {
      const response = await getIndexIntraday("IHSG");
      if (response && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Failed to load IHSG intraday data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarketData();

    // Poll backend setiap 60 detik (1 menit)
    const interval = setInterval(() => {
      loadMarketData();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const isPositive = (data?.change ?? 0) >= 0;

  const chart = useMemo(() => {
    if (!data || !data.candles || data.candles.length < 2) {
      return null;
    }

    const width = 700;
    const height = 220;
    const candles = data.candles;

    const prices = candles.map((c) => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Berikan padding vertikal agar kurva tidak menempel ke batas atas/bawah
    const priceDiff = maxPrice - minPrice;
    const verticalPadding = priceDiff > 0 ? priceDiff * 0.15 : 2;
    const plotMin = minPrice - verticalPadding;
    const plotMax = maxPrice + verticalPadding;
    const plotRange = plotMax - plotMin;

    const points = candles.map((candle, index) => {
      const x = (index / (candles.length - 1)) * width;
      const y = height - ((candle.close - plotMin) / plotRange) * height;
      return { x, y, candle };
    });

    const pointsString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    const lastPoint = points[points.length - 1];

    return {
      pointsString,
      points,
      lastPoint,
      minPrice,
      maxPrice,
      plotMin,
      plotMax,
      plotRange,
      width,
      height,
    };
  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chart || !chart.points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const targetIndex = Math.round(ratio * (chart.points.length - 1));
    const point = chart.points[targetIndex];
    if (point) {
      setHoveredPoint(point.candle);
      setHoverPosition({ x: point.x, y: point.y });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPosition(null);
  };

  const formattedPrice = data
    ? data.latest_price.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";

  const changeFormatted = data
    ? `${data.change >= 0 ? "+" : ""}${data.change.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "0.00";

  const changePercentFormatted = data
    ? `${data.change_percent >= 0 ? "+" : ""}${data.change_percent.toFixed(2)}%`
    : "0.00%";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 md:p-8">
      {/* Background glow */}
      <div
        className={`pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full blur-3xl ${
          isPositive ? "bg-emerald-500/[0.03]" : "bg-rose-500/[0.03]"
        }`}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.22em] text-zinc-500">
                MARKET PULSE
              </span>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium tracking-wider text-zinc-400">
                IDX · BEI
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Indonesian Market
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Monitor the Indonesian equity market through market intelligence.
            </p>
          </div>

          {/* Market Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5 self-start">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-black/40 px-3.5 py-1.5 backdrop-blur">
              <span
                className={`h-2 w-2 rounded-full ${
                  data?.market_status === "Open"
                    ? "animate-pulse bg-emerald-400"
                    : "bg-amber-400/80"
                }`}
              />
              <span className="text-xs font-medium text-zinc-300">
                {data?.market_status === "Open" ? "Market Open" : "Market Closed"}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-black/40 px-3 py-1.5 backdrop-blur">
              <span className="text-xs text-zinc-400">Delayed Market Data</span>
            </div>
          </div>
        </div>

        {/* Main Market Area */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:items-end">
          {/* IHSG Info */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.2em] text-zinc-400">
                IHSG COMPOSITE
              </p>
              {data?.session_date && (
                <span className="text-[11px] text-zinc-600 font-mono">
                  {data.session_date}
                </span>
              )}
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                <div className="h-16 w-56 animate-pulse rounded-xl bg-white/[0.05]" />
                <div className="h-5 w-36 animate-pulse rounded-lg bg-white/[0.03]" />
              </div>
            ) : data ? (
              <>
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className="text-5xl font-semibold tracking-tight md:text-6xl text-white">
                    {formattedPrice}
                  </span>

                  {/* Change pill */}
                  <div
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span>{isPositive ? "▲" : "▼"}</span>
                    <span>{changeFormatted}</span>
                    <span className="font-mono">({changePercentFormatted})</span>
                  </div>
                </div>

                {/* Session range stats */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/[0.06] py-3">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Open
                    </span>
                    <span className="text-xs font-medium font-mono text-zinc-300">
                      {data.open_price.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      High
                    </span>
                    <span className="text-xs font-medium font-mono text-emerald-400">
                      {data.high_price.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                      Low
                    </span>
                    <span className="text-xs font-medium font-mono text-rose-400">
                      {data.low_price.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>IDX Composite Index</span>
                  <span>
                    Last update {data.last_updated_time || "16:00:00"} WIB
                  </span>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-red-400">Unable to load IHSG data</p>
                <button
                  onClick={loadMarketData}
                  className="mt-3 rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Intraday Chart Card */}
          <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/[0.07] bg-black/40 backdrop-blur-sm p-4">
            {/* Chart Top Bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                    IHSG INTRADAY
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    09:00 ─── 16:00 WIB
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {data?.candles_count
                    ? `${data.candles_count} intervals (5m) · ${data.session_date}`
                    : "Fetching session data..."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Active Hover Display */}
                {hoveredPoint ? (
                  <div className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2.5 py-1 border border-white/[0.1]">
                    <span className="text-[11px] font-mono text-zinc-400">
                      {hoveredPoint.time} WIB:
                    </span>
                    <span className="text-[11px] font-semibold font-mono text-white">
                      {hoveredPoint.close.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Auto refresh 60s</span>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Chart Drawing Canvas */}
            <div className="relative mt-3 h-[180px] w-full">
              {/* Background Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between opacity-25 pointer-events-none">
                <div className="border-t border-dashed border-white/[0.08]" />
                <div className="border-t border-dashed border-white/[0.08]" />
                <div className="border-t border-dashed border-white/[0.08]" />
              </div>

              {chart ? (
                <>
                  <svg
                    viewBox="0 0 700 220"
                    preserveAspectRatio="none"
                    className="relative h-full w-full cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <defs>
                      <linearGradient id="intradayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop
                          offset="0%"
                          stopColor={isPositive ? "#10b981" : "#f43f5e"}
                          stopOpacity="0.28"
                        />
                        <stop
                          offset="100%"
                          stopColor={isPositive ? "#10b981" : "#f43f5e"}
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>

                    {/* Gradient Area Fill */}
                    <polygon
                      points={`0,220 ${chart.pointsString} 700,220`}
                      fill="url(#intradayGrad)"
                    />

                    {/* Smooth Price Path Line */}
                    <polyline
                      points={chart.pointsString}
                      fill="none"
                      stroke={isPositive ? "#10b981" : "#f43f5e"}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Last Point Anchor */}
                    <circle
                      cx={chart.lastPoint.x}
                      cy={chart.lastPoint.y}
                      r="4.5"
                      fill={isPositive ? "#10b981" : "#f43f5e"}
                      stroke="#09090b"
                      strokeWidth="2"
                    />

                    {/* Hover cursor guide */}
                    {hoverPosition && (
                      <g>
                        <line
                          x1={hoverPosition.x}
                          y1="0"
                          x2={hoverPosition.x}
                          y2="220"
                          stroke="rgba(255,255,255,0.25)"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cx={hoverPosition.x}
                          cy={hoverPosition.y}
                          r="5"
                          fill="#ffffff"
                          stroke={isPositive ? "#10b981" : "#f43f5e"}
                          strokeWidth="2.5"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Y-Axis Price Bounds */}
                  <div className="pointer-events-none absolute right-2 top-1 flex flex-col justify-between h-[90%] text-[10px] font-mono text-zinc-600">
                    <span>
                      {chart.maxPrice.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                    <span>
                      {((chart.maxPrice + chart.minPrice) / 2).toLocaleString("id-ID", {
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span>
                      {chart.minPrice.toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-600" />
                    <p className="text-xs text-zinc-500">Loading intraday session candles...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Time Axis Markers */}
            <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2 text-[10px] font-mono text-zinc-600">
              <span>09:00</span>
              <span>11:30</span>
              <span>13:30</span>
              <span>16:00 WIB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}