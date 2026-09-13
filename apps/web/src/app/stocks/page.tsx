"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { getStocks } from "@/lib/api";

interface StockItem {
  symbol: string;
  name: string | null;
  sector: string | null;
  price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  timestamp: string;
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalCount, setTotalCount] = useState(0);

  // Search & Sector Filter & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"symbol" | "price" | "change_percent" | "volume">("symbol");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch stocks from backend
  const fetchStocksData = async (targetOffset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch batch from API
      const res = await getStocks(pageSize, targetOffset);
      if (res.success && Array.isArray(res.data)) {
        setStocks(res.data);
        if (res.pagination?.total) {
          setTotalCount(res.pagination.total);
        }
      } else {
        throw new Error(res.message || "Failed to load stocks data");
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const offset = (page - 1) * pageSize;
    fetchStocksData(offset);
  }, [page]);

  // Extract unique sectors from currently loaded batch
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    stocks.forEach((s) => {
      if (s.sector) sectors.add(s.sector);
    });
    return ["ALL", ...Array.from(sectors).sort()];
  }, [stocks]);

  // Filter & sort locally within current page (or loaded data)
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((stock) => {
        const matchesSearch =
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSector =
          selectedSector === "ALL" || stock.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [stocks, searchQuery, selectedSector, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "symbol" ? "asc" : "desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatPrice = (val: number | null) => {
    if (val == null) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatVolume = (val: number) => {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + "B";
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
    if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
    return val.toString();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Stocks" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-[0.2em] text-indigo-400 uppercase">
                IDX Stock Universe
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Indonesia Listed Stocks
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Menampilkan{" "}
              <span className="font-medium text-zinc-300">
                {totalCount > 0 ? totalCount : 0} ticker
              </span>{" "}
              dalam market-data universe NEXUS yang tersimpan di PostgreSQL.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2.5 backdrop-blur-md">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                Total Saham
              </span>
              <span className="text-base font-bold text-white">
                {totalCount > 0 ? totalCount : "..."} Ticker
              </span>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2.5 backdrop-blur-md">
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500">
                Data Source
              </span>
              <span className="text-base font-bold text-emerald-400">
                PostgreSQL + Yahoo
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
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
              placeholder="Cari kode saham atau nama (misal: BBCA, Adaro)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sector Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 whitespace-nowrap">Sektor:</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3 py-2 text-sm text-white transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableSectors.map((sec) => (
                <option key={sec} value={sec} className="bg-zinc-900 text-white">
                  {sec === "ALL" ? "Semua Sektor" : sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stocks Table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/30 backdrop-blur-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="mt-4 text-sm text-zinc-400">
                Memuat data saham...
              </p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-white">Gagal Memuat Data</p>
              <p className="mt-1 text-sm text-zinc-400">{error}</p>
              <button
                onClick={() => fetchStocksData((page - 1) * pageSize)}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <p className="text-base font-semibold text-white">Tidak ada saham yang cocok</p>
              <p className="mt-1 text-sm">Coba kata kunci pencarian atau filter sektor lain.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th
                      onClick={() => handleSort("symbol")}
                      className="cursor-pointer py-3.5 pl-6 pr-4 font-semibold hover:text-white transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Ticker / Perusahaan</span>
                        {sortField === "symbol" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Sektor</th>
                    <th
                      onClick={() => handleSort("price")}
                      className="cursor-pointer px-4 py-3.5 text-right font-semibold hover:text-white transition"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Harga Terakhir</span>
                        {sortField === "price" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("change_percent")}
                      className="cursor-pointer px-4 py-3.5 text-right font-semibold hover:text-white transition"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Perubahan (24j)</span>
                        {sortField === "change_percent" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("volume")}
                      className="cursor-pointer py-3.5 pl-4 pr-6 text-right font-semibold hover:text-white transition"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Volume</span>
                        {sortField === "volume" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredStocks.map((stock) => {
                    const change = stock.change ?? 0;
                    const changePercent = stock.change_percent ?? 0;
                    const isPositive = change > 0;
                    const isNegative = change < 0;

                    return (
                      <tr
                        key={stock.symbol}
                        className="group transition hover:bg-white/[0.02]"
                      >
                        {/* Ticker & Name */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-950 font-bold text-white transition group-hover:border-indigo-500/40">
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white tracking-wide">
                                  {stock.symbol}
                                </span>
                                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400">
                                  .JK
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 line-clamp-1 max-w-xs sm:max-w-sm">
                                {stock.name || `${stock.symbol} Tbk.`}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sector */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-lg border border-white/[0.06] bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-300">
                            {stock.sector || "Unclassified"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4 text-right font-semibold text-white">
                          {formatPrice(stock.price)}
                        </td>

                        {/* Change */}
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${isPositive
                                ? "text-emerald-400"
                                : isNegative
                                  ? "text-rose-400"
                                  : "text-zinc-400"
                              }`}
                          >
                            {isPositive ? "+" : ""}
                            {changePercent.toFixed(2)}%
                            <span className="text-[11px] font-normal opacity-80">
                              ({isPositive ? "+" : ""}
                              {change.toFixed(0)})
                            </span>
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-4 pl-4 pr-6 text-right font-mono text-xs text-zinc-400">
                          {formatVolume(stock.volume)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && !error && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] bg-zinc-950/40 px-6 py-4 sm:flex-row">
              <div className="text-xs text-zinc-400">
                Menampilkan{" "}
                <span className="font-semibold text-white">
                  {(page - 1) * pageSize + 1}
                </span>{" "}
                sampai{" "}
                <span className="font-semibold text-white">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-white">{totalCount}</span> saham
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Sebelumnya
                </button>
                <div className="flex items-center px-2 text-xs text-zinc-400">
                  Halaman <span className="mx-1 font-bold text-white">{page}</span> dari{" "}
                  <span className="ml-1 font-bold text-white">{totalPages}</span>
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>

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
