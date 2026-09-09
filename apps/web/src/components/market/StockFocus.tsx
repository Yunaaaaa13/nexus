"use client";

import { useEffect, useState } from "react";
import { getStock } from "@/lib/api";

interface StockData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  source: string;
}

export default function StockFocus() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStock() {
      try {
        const response = await getStock("BBCA");
        setData(response.data);
      } catch (error) {
        console.error("Failed to load BBCA:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStock();
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            STOCK FOCUS
          </p>
          <h2 className="mt-1 text-lg font-semibold">BBCA</h2>
        </div>

        <span className="text-xs text-zinc-600">Yahoo Finance</span>
      </div>

      {loading ? (
        <div className="mt-6 h-20 animate-pulse rounded-xl bg-white/[0.04]" />
      ) : data ? (
        <>
          <div className="mt-6">
            <p className="text-4xl font-semibold">
              Rp {data.price.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-zinc-600">Delayed market data</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Open" value={data.open} />
            <Metric label="High" value={data.high} />
            <Metric label="Low" value={data.low} />
            <Metric label="Volume" value={data.volume} />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-red-400">Failed to load BBCA data</p>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
