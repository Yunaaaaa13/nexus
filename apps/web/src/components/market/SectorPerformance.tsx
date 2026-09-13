"use client";

import { useEffect, useState } from "react";
import { getSectorPerformance } from "@/lib/api";

interface SectorStock {
    symbol: string;
    change_percent: number;
}

interface Sector {
    sector: string;
    stock_count: number;
    average_change_percent: number;
    stocks: SectorStock[];
}

export default function SectorPerformance() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadSectors() {
        try {
            const response = await getSectorPerformance();

            setSectors(response.data);
        } catch (error) {
            console.error(
                "Failed to load sector performance:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSectors();

        const interval = setInterval(() => {
            loadSectors();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="mt-10">
            <div className="mb-4 flex items-end justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
                        SECTOR ANALYTICS
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                        Sector Performance
                    </h2>
                </div>

                <span className="text-xs text-zinc-600">
                    Auto refresh 60s
                </span>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
                {loading ? (
                    <LoadingState />
                ) : sectors.length === 0 ? (
                    <div className="py-10 text-center text-xs text-zinc-600">
                        No sector data available
                    </div>
                ) : (
                    <div className="space-y-5">
                        {sectors.map((sector) => (
                            <SectorRow
                                key={sector.sector}
                                sector={sector}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function SectorRow({
    sector,
}: {
    sector: Sector;
}) {
    const change = sector.average_change_percent;

    const positive = change > 0;
    const negative = change < 0;

    const maxBar = 5;

    const width = Math.min(
        Math.abs(change) / maxBar * 100,
        100
    );

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-sm font-medium">
                        {sector.sector}
                    </div>

                    <div className="mt-1 text-[10px] text-zinc-600">
                        {sector.stock_count}{" "}
                        {sector.stock_count === 1
                            ? "stock"
                            : "stocks"}
                    </div>
                </div>

                <div
                    className={
                        positive
                            ? "text-xs font-semibold text-emerald-400"
                            : negative
                                ? "text-xs font-semibold text-red-400"
                                : "text-xs font-semibold text-zinc-400"
                    }
                >
                    {positive
                        ? "▲"
                        : negative
                            ? "▼"
                            : "—"}{" "}
                    {Math.abs(change).toFixed(2)}%
                </div>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                    className={
                        positive
                            ? "h-full rounded-full bg-emerald-400"
                            : negative
                                ? "h-full rounded-full bg-red-400"
                                : "h-full rounded-full bg-zinc-500"
                    }
                    style={{
                        width: `${width}%`,
                    }}
                />
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((item) => (
                <div key={item}>
                    <div className="flex justify-between">
                        <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
                    </div>

                    <div className="mt-2 h-1.5 animate-pulse rounded bg-white/[0.06]" />
                </div>
            ))}
        </div>
    );
}