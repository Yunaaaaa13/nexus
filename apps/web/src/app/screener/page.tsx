"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { getScreener } from "@/lib/api";

interface ScreenerStock {
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

interface ScreenerResponse {
  success: boolean;
  data: ScreenerStock[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    returned: number;
  };
}

const SECTORS = [
  "ALL",
  "Financials",
  "Basic Materials",
  "Energy",
  "Healthcare",
  "Technology",
  "Communication Services",
  "Consumer Staples",
  "Consumer Cyclicals",
  "Industrials",
  "Utilities",
  "Infrastructure",
  "Transportation & Logistics",
  "Properties & Real Estate",
];

export default function ScreenerView() {
  // =========================
  // DATA
  // =========================

  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // =========================
  // UI STATE
  // =========================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // FILTER STATE
  // =========================

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("ALL");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [minChange, setMinChange] = useState("");
  const [maxChange, setMaxChange] = useState("");

  const [minVolume, setMinVolume] = useState("");

  // =========================
  // PAGINATION
  // =========================

  const [page, setPage] = useState(1);

  const pageSize = 50;

  // =========================
  // FETCH DATA
  // =========================

  const buildFilters = () => ({
    search: search.trim() || undefined,
    sector: sector !== "ALL" ? sector : undefined,

    min_price:
      minPrice !== "" ? Number(minPrice) : undefined,

    max_price:
      maxPrice !== "" ? Number(maxPrice) : undefined,

    min_change:
      minChange !== "" ? Number(minChange) : undefined,

    max_change:
      maxChange !== "" ? Number(maxChange) : undefined,

    min_volume:
      minVolume !== "" ? Number(minVolume) : undefined,
  });

  const fetchScreener = async (
    targetPage = page,
    filters = buildFilters()
  ) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (targetPage - 1) * pageSize;

      const response: ScreenerResponse = await getScreener({
        ...filters,
        limit: pageSize,
        offset,
      });

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Invalid response from screener API");
      }

      setStocks(response.data);
      setTotalCount(response.pagination?.total ?? 0);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load screener data"
      );

      setStocks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchScreener(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // APPLY FILTER
  // =========================

  const handleApplyFilters = () => {
    setPage(1);
    fetchScreener(1);
  };

  // =========================
  // RESET FILTER
  // =========================

  const handleResetFilters = () => {
    setSearch("");
    setSector("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinChange("");
    setMaxChange("");
    setMinVolume("");

    setPage(1);

    fetchScreener(1, {
      search: undefined,
      sector: undefined,
      min_price: undefined,
      max_price: undefined,
      min_change: undefined,
      max_change: undefined,
      min_volume: undefined,
    });
  };

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  const handlePreviousPage = () => {
    if (page <= 1) return;

    const nextPage = page - 1;
    setPage(nextPage);
    fetchScreener(nextPage);
  };

  const handleNextPage = () => {
    if (page >= totalPages) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchScreener(nextPage);
  };

  // =========================
  // FORMATTING
  // =========================

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  const formatVolume = (value: number) => {
    if (!value) {
      return "0";
    }

    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }

    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }

    return value.toLocaleString("id-ID");
  };

  // =========================
  // FILTER SUMMARY
  // =========================

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search.trim()) count++;
    if (sector !== "ALL") count++;
    if (minPrice !== "") count++;
    if (maxPrice !== "") count++;
    if (minChange !== "") count++;
    if (maxChange !== "") count++;
    if (minVolume !== "") count++;

    return count;
  }, [
    search,
    sector,
    minPrice,
    maxPrice,
    minChange,
    maxChange,
    minVolume,
  ]);

  // =========================
  // EXPORT CSV
  // =========================

  const handleExportCSV = () => {
    if (!stocks.length) return;

    const headers = [
      "Ticker",
      "Company Name",
      "Sector",
      "Price",
      "Previous Close",
      "Change",
      "Change %",
      "Volume",
      "Timestamp",
    ];

    const rows = stocks.map((stock) => [
      stock.symbol,
      stock.name ?? "",
      stock.sector ?? "",
      stock.price ?? "",
      stock.previous_close ?? "",
      stock.change ?? "",
      stock.change_percent ?? "",
      stock.volume ?? 0,
      stock.timestamp ?? "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `nexus-screener-page-${page}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Screener" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">

      <div className="space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />

            <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
              EQUITY SCREENER
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Indonesia Stock Screener
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Filter and evaluate stocks in the NEXUS market-data universe
          </p>
        </div>

        <div className="flex items-center gap-2">

          <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400">
            <span className="font-semibold text-white">
              {totalCount.toLocaleString("id-ID")}
            </span>{" "}
            results
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!stocks.length}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export CSV
          </button>

        </div>
      </div>


      {/* ================= FILTER PANEL ================= */}

      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-white">
              Screening Filters
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Filter saham langsung melalui PostgreSQL
            </p>
          </div>

          {activeFilterCount > 0 && (
            <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400">
              {activeFilterCount} active
            </span>
          )}

        </div>


        {/* Search */}

        <div className="mb-4">

          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Search
          </label>

          <input
            type="text"
            placeholder="Search ticker atau nama perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApplyFilters();
              }
            }}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500"
          />

        </div>


        {/* Filters */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Sector */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Sector
            </label>

            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {SECTORS.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-zinc-900"
                >
                  {item === "ALL" ? "All Sectors" : item}
                </option>
              ))}
            </select>
          </div>


          {/* Min Price */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Min Price
            </label>

            <input
              type="number"
              min="0"
              placeholder="e.g. 1000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500"
            />
          </div>


          {/* Max Price */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Max Price
            </label>

            <input
              type="number"
              min="0"
              placeholder="e.g. 10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500"
            />
          </div>


          {/* Min Volume */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Min Volume
            </label>

            <input
              type="number"
              min="0"
              placeholder="e.g. 1000000"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500"
            />
          </div>


          {/* Min Change */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Min Change %
            </label>

            <input
              type="number"
              step="0.1"
              placeholder="-5"
              value={minChange}
              onChange={(e) => setMinChange(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500"
            />
          </div>


          {/* Max Change */}

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Max Change %
            </label>

            <input
              type="number"
              step="0.1"
              placeholder="5"
              value={maxChange}
              onChange={(e) => setMaxChange(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500"
            />
          </div>

        </div>


        {/* Buttons */}

        <div className="mt-5 flex flex-wrap gap-2">

          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Filtering..." : "Apply Filters"}
          </button>

          <button
            onClick={handleResetFilters}
            className="rounded-xl border border-white/[0.08] bg-zinc-950 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Reset
          </button>

        </div>

      </div>


      {/* ================= RESULTS ================= */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60">

        {loading ? (

          <div className="flex flex-col items-center justify-center py-24">

            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />

            <p className="mt-4 text-sm text-zinc-400">
              Running stock screener...
            </p>

          </div>

        ) : error ? (

          <div className="py-20 text-center">

            <p className="text-base font-semibold text-white">
              Gagal Memuat Screener
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {error}
            </p>

            <button
              onClick={() => fetchScreener(page)}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Coba Lagi
            </button>

          </div>

        ) : stocks.length === 0 ? (

          <div className="py-20 text-center">

            <p className="text-base font-semibold text-white">
              No stocks found
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Coba ubah filter yang digunakan.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-500">

                <tr>

                  <th className="px-6 py-4">
                    Ticker
                  </th>

                  <th className="px-6 py-4">
                    Company Name
                  </th>

                  <th className="px-6 py-4">
                    Sector
                  </th>

                  <th className="px-6 py-4 text-right">
                    Price
                  </th>

                  <th className="px-6 py-4 text-right">
                    Change
                  </th>

                  <th className="px-6 py-4 text-right">
                    Volume
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-white/[0.04]">

                {stocks.map((stock) => {

                  const change = stock.change ?? 0;
                  const changePercent =
                    stock.change_percent ?? 0;

                  const isPositive = change > 0;
                  const isNegative = change < 0;

                  return (

                    <tr
                      key={stock.symbol}
                      className="transition hover:bg-white/[0.02]"
                    >

                      {/* Ticker */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-950 text-xs font-bold text-white">
                            {stock.symbol.slice(0, 2)}
                          </div>

                          <div>

                            <div className="font-bold tracking-wide text-white">
                              {stock.symbol}
                            </div>

                            <div className="text-[10px] text-zinc-600">
                              .JK
                            </div>

                          </div>

                        </div>

                      </td>


                      {/* Company */}

                      <td className="px-6 py-4">

                        <div className="max-w-xs truncate text-zinc-300">
                          {stock.name || `${stock.symbol} Tbk.`}
                        </div>

                      </td>


                      {/* Sector */}

                      <td className="px-6 py-4">

                        <span className="inline-flex rounded-lg border border-white/[0.06] bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-400">
                          {stock.sector || "Unclassified"}
                        </span>

                      </td>


                      {/* Price */}

                      <td className="px-6 py-4 text-right font-semibold text-white">
                        {formatPrice(stock.price)}
                      </td>


                      {/* Change */}

                      <td className="px-6 py-4 text-right">

                        <div
                          className={
                            isPositive
                              ? "font-semibold text-emerald-400"
                              : isNegative
                                ? "font-semibold text-rose-400"
                                : "font-semibold text-zinc-400"
                          }
                        >

                          {isPositive ? "+" : ""}
                          {changePercent.toFixed(2)}%

                        </div>

                        <div className="text-[10px] text-zinc-600">

                          {isPositive ? "+" : ""}
                          {change.toFixed(0)}

                        </div>

                      </td>


                      {/* Volume */}

                      <td className="px-6 py-4 text-right font-mono text-xs text-zinc-400">
                        {formatVolume(stock.volume)}
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}


        {/* ================= PAGINATION ================= */}

        {!loading && !error && stocks.length > 0 && (

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] bg-zinc-950/40 px-6 py-4 sm:flex-row">

            <div className="text-xs text-zinc-500">

              Menampilkan{" "}

              <span className="font-semibold text-white">
                {(page - 1) * pageSize + 1}
              </span>

              {" "}—{" "}

              <span className="font-semibold text-white">
                {Math.min(
                  page * pageSize,
                  totalCount
                )}
              </span>

              {" "}dari{" "}

              <span className="font-semibold text-white">
                {totalCount.toLocaleString("id-ID")}
              </span>

            </div>


            <div className="flex items-center gap-2">

              <button
                disabled={page <= 1}
                onClick={handlePreviousPage}
                className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Sebelumnya
              </button>


              <div className="px-2 text-xs text-zinc-500">

                Halaman{" "}

                <span className="font-bold text-white">
                  {page}
                </span>

                {" "}dari{" "}

                <span className="font-bold text-white">
                  {totalPages}
                </span>

              </div>


              <button
                disabled={page >= totalPages}
                onClick={handleNextPage}
                className="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Selanjutnya →
              </button>

            </div>

          </div>

        )}

      </div>


      {/* ================= DATA NOTE ================= */}

      <div className="rounded-xl border border-white/[0.05] bg-zinc-900/30 px-4 py-3">

        <div className="flex flex-col gap-1 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between">

          <span>
            NEXUS Screener · PostgreSQL market-data layer
          </span>

          <span>
            Price / volume data from Yahoo Finance
          </span>

        </div>

      </div>

      </div>

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