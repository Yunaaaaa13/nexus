"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { getScreener, getSectorPerformance } from "@/lib/api";

interface StockItem {
  symbol: string;
  name: string | null;
  sector: string | null;
  price: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number;
  timestamp: string | null;
}

type SortKey = "symbol" | "price" | "change_percent" | "volume";

const PAGE_SIZE = 50;

const SORT_OPTIONS: { value: string; label: string; key: SortKey; order: "asc" | "desc" }[] = [
  { value: "symbol_asc", label: "Ticker (A-Z)", key: "symbol", order: "asc" },
  { value: "symbol_desc", label: "Ticker (Z-A)", key: "symbol", order: "desc" },
  { value: "price_desc", label: "Price (High - Low)", key: "price", order: "desc" },
  { value: "price_asc", label: "Price (Low - High)", key: "price", order: "asc" },
  { value: "change_desc", label: "Change (High - Low)", key: "change_percent", order: "desc" },
  { value: "change_asc", label: "Change (Low - High)", key: "change_percent", order: "asc" },
  { value: "volume_desc", label: "Volume (High - Low)", key: "volume", order: "desc" },
  { value: "volume_asc", label: "Volume (Low - High)", key: "volume", order: "asc" },
];

const formatPrice = (val: number | null) => {
  if (val === null || !Number.isFinite(val)) return "—";
  return val.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatVolume = (val: number) => {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + "B";
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
  return val.toString();
};

export default function StocksPage() {
  const router = useRouter();

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [sortKey, setSortKey] = useState("symbol_asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getSectorPerformance()
      .then((res) => {
        if (res?.data) {
          setSectors(res.data.map((s: { sector: string }) => s.sector).sort());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError(null);
      setLoading(true);

      getScreener({
        search: searchQuery.trim() || undefined,
        sector: selectedSector === "ALL" ? undefined : selectedSector,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
        .then((res) => {
          if (res?.success && Array.isArray(res.data)) {
            setStocks(res.data);
            setTotalCount(res.pagination?.total ?? 0);
          } else {
            throw new Error(res?.message || "Failed to load stocks data");
          }
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unable to connect to server");
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, selectedSector, page, reloadKey]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];

  const sortedStocks = useMemo(() => {
    const arr = [...stocks];
    arr.sort((a, b) => {
      const key = activeSort.key;
      let va: string | number | null = a[key] as string | number | null;
      let vb: string | number | null = b[key] as string | number | null;

      if (key !== "symbol") {
        if (va === null || va === undefined) va = Number.NEGATIVE_INFINITY;
        if (vb === null || vb === undefined) vb = Number.NEGATIVE_INFINITY;
      }

      if (typeof va === "string" && typeof vb === "string") {
        return activeSort.order === "asc"
          ? va.localeCompare(vb, "en")
          : vb.localeCompare(va, "en");
      }

      const na = typeof va === "string" ? NaN : (va as number);
      const nb = typeof vb === "string" ? NaN : (vb as number);
      return activeSort.order === "asc" ? na - nb : nb - na;
    });
    return arr;
  }, [stocks, activeSort]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleSector = (value: string) => {
    setSelectedSector(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Stocks" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
              <span className="h-2 w-2 rounded-full bg-indigo-400/80" />
              Stock Explorer
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Browse Indonesian Equities
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {totalCount.toLocaleString("id-ID")} ticker dengan data harga terbaru
              dalam universe NEXUS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                Tickers
              </span>
              <span className="text-base font-semibold tabular-nums text-white">
                {totalCount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                Data
              </span>
              <span className="text-base font-semibold text-emerald-400">
                PostgreSQL
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari ticker atau nama perusahaan..."
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 transition hover:text-white"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSector}
              onChange={(e) => handleSector(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 px-3 py-2.5 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 sm:w-auto"
            >
              <option value="ALL" className="bg-zinc-900 text-white">
                Semua Sektor
              </option>
              {sectors.map((sec) => (
                <option key={sec} value={sec} className="bg-zinc-900 text-white">
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Card */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {/* Toolbar */}
          <div className="flex flex-col justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              {loading
                ? "Memuat..."
                : `${sortedStocks.length.toLocaleString("id-ID")} / ${totalCount.toLocaleString("id-ID")} ticker`}
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500">Sort by</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 transition focus:border-indigo-500/60 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">Memuat data saham...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-base font-semibold text-white">Gagal Memuat Data</p>
              <p className="mt-1 text-sm text-zinc-400">{error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Coba Lagi
              </button>
            </div>
          ) : sortedStocks.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <p className="text-base font-semibold text-white">Tidak ada saham yang cocok</p>
              <p className="mt-1 text-sm">Coba kata kunci pencarian atau filter sektor lain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-zinc-950/40 text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-3.5 pl-6 pr-4 font-semibold">Ticker / Perusahaan</th>
                    <th className="px-4 py-3.5 font-semibold">Sektor</th>
                    <th className="px-4 py-3.5 text-right font-semibold tabular-nums">Price</th>
                    <th className="px-4 py-3.5 text-right font-semibold tabular-nums">Change</th>
                    <th className="py-3.5 pl-4 pr-6 text-right font-semibold tabular-nums">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {sortedStocks.map((stock) => {
                    const change = stock.change ?? 0;
                    const changePercent = stock.change_percent ?? 0;
                    const isPositive = change > 0;
                    const isNegative = change < 0;

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() =>
                          router.push(`/stocks/${stock.symbol.toLowerCase()}`)
                        }
                        className="group cursor-pointer transition hover:bg-white/[0.02]"
                      >
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-950 font-bold text-white transition group-hover:border-indigo-500/40">
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/stocks/${stock.symbol.toLowerCase()}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-bold tracking-wide text-white transition group-hover:text-indigo-300"
                                >
                                  {stock.symbol}
                                </Link>
                                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400">
                                  .JK
                                </span>
                              </div>
                              <div className="max-w-xs truncate text-xs text-zinc-400 sm:max-w-sm">
                                {stock.name || `${stock.symbol} Tbk.`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-lg border border-white/[0.06] bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-300">
                            {stock.sector || "Unclassified"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right font-semibold tabular-nums text-white">
                          {formatPrice(stock.price)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                              isPositive
                                ? "text-emerald-400"
                                : isNegative
                                  ? "text-rose-400"
                                  : "text-zinc-400"
                            }`}
                          >
                            {isPositive ? "▲" : isNegative ? "▼" : ""}
                            {isPositive ? "+" : ""}
                            {changePercent.toFixed(2)}%
                          </span>
                        </td>

                        <td className="py-4 pl-4 pr-6 text-right font-mono text-xs tabular-nums text-zinc-400">
                          {formatVolume(stock.volume)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && stocks.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] px-6 py-4 sm:flex-row">
              <div className="text-xs text-zinc-500">
                Menampilkan{" "}
                <span className="font-semibold text-white">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-white">
                  {Math.min(page * PAGE_SIZE, totalCount).toLocaleString("id-ID")}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-white">
                  {totalCount.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  « Sebelumnya
                </button>
                <div className="px-2 text-xs tabular-nums text-zinc-400">
                  <span className="font-bold text-white">{page}</span> / {totalPages}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Selanjutnya »
                </button>
              </div>
            </div>
          )}
        </section>

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