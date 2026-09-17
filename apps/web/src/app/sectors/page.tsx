"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { getSectorAnalytics, getSectorRotation } from "@/lib/api";
import SectorPerformance from "@/components/sectors/SectorPerformance";
import SectorRotation from "@/components/sectors/SectorRotation";
import SectorRotationMatrix from "@/components/sectors/SectorRotationMatrix";

type Sector = {
  sector: string;
  stock_count: number;
  advancing: number;
  declining: number;
  unchanged: number;
  avg_change_percent: number;
  breadth_percent: number;
  total_volume: number;
  momentum: string;
};

type RotationSector = {
  sector: string;
  stock_count: number;
  advancing: number;
  declining: number;
  unchanged: number;
  daily_change_percent: number;
  performance_20d: number;
  breadth_percent: number;
  rotation_state: string;
};

type SectorRotationResponse = {
  sectors: RotationSector[];
  benchmarks: {
    performance_20d_median: number;
    breadth_median: number;
  };
};

export default function SectorsPage() {
  const [data, setData] = useState<Sector[]>([]);
  const [rotation, setRotation] =
    useState<SectorRotationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [performanceResponse, rotationResponse] =
          await Promise.all([
            getSectorAnalytics(),
            getSectorRotation(),
          ]);

        setData(performanceResponse.data ?? []);
        setRotation(rotationResponse.data ?? null);
      } catch (err) {
        console.error(err);
        setError("Failed to load sector data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar activeTab="Sectors" />

        <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
          <div className="animate-pulse">
            <div className="h-7 w-48 rounded bg-white/10" />
            <div className="mt-3 h-4 w-80 rounded bg-white/5" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar activeTab="Sectors" />

        <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-400">
            {error}
          </div>
        </main>
      </div>
    );
  }

  const positive = data.filter(
    (item) => item.avg_change_percent > 0
  ).length;

  const strongest =
    data.length > 0
      ? data.reduce((prev, current) =>
          current.avg_change_percent >
          prev.avg_change_percent
            ? current
            : prev
        )
      : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Sectors" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Sector Intelligence
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Market performance, breadth, and momentum
                across sectors.
              </p>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Sectors Tracked
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {data.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Positive Sectors
            </p>

            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {positive}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Strongest Performance
            </p>

            <p className="mt-2 text-lg font-semibold">
              {strongest
                ? `${strongest.sector} ${strongest.avg_change_percent > 0 ? "+" : ""}${strongest.avg_change_percent.toFixed(2)}%`
                : "-"}
            </p>

            {strongest && (
              <p className="mt-1 text-xs text-zinc-500">
                {strongest.advancing} advancing ·{" "}
                {strongest.declining} declining ·{" "}
                {strongest.breadth_percent.toFixed(1)}% breadth
              </p>
            )}
          </div>
        </div>

        {/* Sector performance */}
        <SectorPerformance data={data} />

        {/* Sector rotation */}
        {rotation && (
          <div className="mt-6">
            <SectorRotationMatrix
              data={rotation.sectors}
              performanceMedian={
                rotation.benchmarks.performance_20d_median
              }
              breadthMedian={
                rotation.benchmarks.breadth_median
              }
            />
          </div>
        )}

        {/* Momentum */}
        <div className="mt-6">
          <SectorRotation data={data} />
        </div>

        {/* Data note */}
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <p className="text-xs text-zinc-600">
            Sector metrics are calculated from available
            stock market data in the NEXUS database.
          </p>
        </div>
      </main>
    </div>
  );
}