"use client";

import { useEffect, useState } from "react";
import { getMarketMovers } from "@/lib/api";

interface StockMover {
  symbol: string;
  name: string;
  sector: string | null;
  price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

interface MoversData {
  gainers: StockMover[];
  losers: StockMover[];
}

function StockRow({
  stock,
  positive,
}: {
  stock: StockMover;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {stock.symbol}
        </span>

        <span className="hidden text-[10px] text-zinc-600 sm:inline">
          {stock.name}
        </span>
      </div>

      <span
        className={
          positive
            ? "text-xs font-medium text-emerald-400"
            : "text-xs font-medium text-red-400"
        }
      >
        {positive ? "▲" : "▼"}{" "}
        {Math.abs(stock.change_percent).toFixed(2)}%
      </span>
    </div>
  );
}

export default function TopMovers() {
  const [data, setData] = useState<MoversData>({
    gainers: [],
    losers: [],
  });

  const [loading, setLoading] = useState(true);

  async function loadMovers() {
    try {
      const response = await getMarketMovers(5);

      setData(response.data);
    } catch (error) {
      console.error(
        "Failed to load market movers:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovers();

    const interval = setInterval(() => {
      loadMovers();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            TOP MOVERS
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Market Leaders
          </h2>
        </div>

        <button className="text-xs text-zinc-600 transition hover:text-white">
          View all →
        </button>
      </div>

      {/* Movers */}
      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-10">

        {/* Gainers */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Gainers
          </p>

          <div className="mt-2 divide-y divide-white/[0.05]">
            {loading ? (
              <LoadingRows />
            ) : data.gainers.length === 0 ? (
              <EmptyState />
            ) : (
              data.gainers.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  positive
                />
              ))
            )}
          </div>
        </div>

        {/* Losers */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Losers
          </p>

          <div className="mt-2 divide-y divide-white/[0.05]">
            {loading ? (
              <LoadingRows />
            ) : data.losers.length === 0 ? (
              <EmptyState />
            ) : (
              data.losers.map((stock) => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  positive={false}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

function LoadingRows() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center justify-between py-3"
        >
          <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />

          <div className="h-3 w-14 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="py-6 text-xs text-zinc-600">
      No movers available
    </div>
  );
}