"use client";

import { useEffect, useState } from "react";
import { getMarketBreadth } from "@/lib/api";

interface BreadthData {
  total: number;

  advancing: {
    count: number;
    percent: number;
    symbols: string[];
  };

  declining: {
    count: number;
    percent: number;
    symbols: string[];
  };

  unchanged: {
    count: number;
    percent: number;
    symbols: string[];
  };

  advance_decline_ratio: number | null;
}

export default function MarketBreadth() {
  const [data, setData] =
    useState<BreadthData | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadBreadth() {
    try {
      const response =
        await getMarketBreadth();

      setData(response.data);
    } catch (error) {
      console.error(
        "Failed to load market breadth:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBreadth();

    const interval = setInterval(() => {
      loadBreadth();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="mt-10">
        <div className="h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-zinc-900/60" />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const ratio =
    data.advance_decline_ratio;

  let bias = "Neutral";

  if (ratio !== null) {
    if (ratio >= 1.5) {
      bias = "Broadly Positive";
    } else if (ratio > 1) {
      bias = "Slightly Positive";
    } else if (ratio <= 0.67) {
      bias = "Broadly Negative";
    } else if (ratio < 1) {
      bias = "Slightly Negative";
    }
  }

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            MARKET BREADTH
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Market Participation
          </h2>
        </div>

        <span className="text-xs text-zinc-600">
          {data.total} active stocks
        </span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">

          <BreadthStat
            label="Advancing"
            count={data.advancing.count}
            percent={data.advancing.percent}
            positive
          />

          <BreadthStat
            label="Declining"
            count={data.declining.count}
            percent={data.declining.percent}
          />

          <BreadthStat
            label="Unchanged"
            count={data.unchanged.count}
            percent={data.unchanged.percent}
            neutral
          />

        </div>

        {/* Breadth Bar */}
        <div className="mt-8">

          <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.15em] text-zinc-600">
            <span>Market participation</span>
            <span>{data.total} stocks</span>
          </div>

          <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">

            <div
              className="bg-emerald-400"
              style={{
                width: `${data.advancing.percent}%`,
              }}
            />

            <div
              className="bg-red-400"
              style={{
                width: `${data.declining.percent}%`,
              }}
            />

            <div
              className="bg-zinc-600"
              style={{
                width: `${data.unchanged.percent}%`,
              }}
            />

          </div>

        </div>

        {/* Ratio */}
        <div className="mt-8 flex items-end justify-between border-t border-white/[0.05] pt-6">

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Advance / Decline Ratio
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {ratio !== null
                ? ratio.toFixed(2)
                : "—"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Market Bias
            </p>

            <p className="mt-2 text-sm font-medium">
              {bias}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

function BreadthStat({
  label,
  count,
  percent,
  positive,
  neutral,
}: {
  label: string;
  count: number;
  percent: number;
  positive?: boolean;
  neutral?: boolean;
}) {
  let color = "text-red-400";

  if (positive) {
    color = "text-emerald-400";
  }

  if (neutral) {
    color = "text-zinc-400";
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-semibold ${color}`}
        >
          {count}
        </span>

        <span className="text-xs text-zinc-600">
          {percent.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}