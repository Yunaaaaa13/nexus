"use client";

import { useEffect, useState } from "react";
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

export default function MarketPulse() {
  const [data, setData] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const response = await getIndex("IHSG");
        setData(response.data);
      } catch (error) {
        console.error("Failed to load IHSG:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMarketData();
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
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
              A market intelligence layer for understanding Indonesia&apos;s
              equity market.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-white/[0.07] bg-black/20 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-zinc-400">Delayed Market Data</span>
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-zinc-600">
              IHSG
            </p>

            {loading ? (
              <div className="mt-2 h-16 w-72 animate-pulse rounded-lg bg-white/[0.05]" />
            ) : data ? (
              <>
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <span className="text-5xl font-semibold tracking-tight md:text-6xl">
                    {data.price.toLocaleString("id-ID", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <p className="mt-3 text-xs text-zinc-600">
                  IDX Composite · {data.source}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-red-400">
                Failed to load market data
              </p>
            )}
          </div>

          <div className="hidden h-24 w-64 md:block">
            <svg
              viewBox="0 0 260 100"
              className="h-full w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 68 C20 65 25 42 45 50 C65 58 67 73 86 63 C105 53 108 25 128 34 C148 43 145 70 165 58 C185 46 193 22 211 30 C230 38 237 25 260 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-zinc-500"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
