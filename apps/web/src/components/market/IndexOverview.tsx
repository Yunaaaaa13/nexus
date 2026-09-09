"use client";

import { useEffect, useState } from "react";
import { getIndexOverview } from "@/lib/api";

interface IndexItem {
  symbol: string;
  name: string;
  price: number | null;
  change_percent?: number | null;
  timestamp?: string;
  source?: string;
  available?: boolean;
}

export default function IndexOverview() {
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadIndices() {
    try {
      const response = await getIndexOverview();

      setIndices(response.data);
    } catch (error) {
      console.error(
        "Failed to load index overview:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIndices();

    const interval = setInterval(
      loadIndices,
      60000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">

        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            MARKET INDICES
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Index Overview
          </h2>
        </div>

        <span className="text-xs text-zinc-600">
          Today
        </span>

      </div>

      <div className="grid gap-3 md:grid-cols-3">

        {loading
          ? [1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/[0.06] bg-zinc-900/60"
              />
            ))
          : indices.map((index) => (
              <IndexCard
                key={index.symbol}
                index={index}
              />
            ))}

      </div>
    </section>
  );
}

function IndexCard({
  index,
}: {
  index: IndexItem;
}) {
  const available =
    index.available !== false &&
    index.price !== null;

  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 transition hover:border-white/[0.12] hover:bg-zinc-900">

      <div className="flex items-center justify-between">

        <span className="text-xs font-semibold tracking-wider text-zinc-500">
          {index.symbol}
        </span>

        <span className="text-[10px] text-zinc-700">
          IDX
        </span>

      </div>

      <div className="mt-5 flex items-end justify-between">

        <div>

          {available ? (
            <span className="text-2xl font-semibold">
              {index.price!.toLocaleString(
                "id-ID",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          ) : (
            <span className="text-2xl font-semibold text-zinc-700">
              —
            </span>
          )}

        </div>

        {available &&
        index.change_percent !== null &&
        index.change_percent !== undefined ? (
          <span
            className={
              index.change_percent >= 0
                ? "text-xs font-medium text-emerald-400"
                : "text-xs font-medium text-red-400"
            }
          >
            {index.change_percent >= 0
              ? "▲"
              : "▼"}{" "}
            {Math.abs(
              index.change_percent
            ).toFixed(2)}
            %
          </span>
        ) : (
          <span className="text-xs text-zinc-700">
            —
          </span>
        )}

      </div>

      {!available && (
        <p className="mt-3 text-[10px] text-zinc-700">
          Data source unavailable
        </p>
      )}

    </div>
  );
}
