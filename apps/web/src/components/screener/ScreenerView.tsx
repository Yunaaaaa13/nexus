"use client";

import { useEffect, useState } from "react";
import { getScreener } from "@/lib/api";

type Stock = {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | null;
  previous_close: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  timestamp: string | null;
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  volatility20: number | null;
  trend: string | null;
};

type ScreenerResponse = {
  success: boolean;
  data: Stock[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    returned: number;
  };
};

const PAGE_SIZE = 50;

export default function ScreenerView() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("ALL");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [minChange, setMinChange] = useState("");
  const [maxChange, setMaxChange] = useState("");

  const [minVolume, setMinVolume] = useState("");

  const [trend, setTrend] = useState("ALL");
  const [rsiMin, setRsiMin] = useState("");
  const [rsiMax, setRsiMax] = useState("");
  const [macdSignal, setMacdSignal] = useState("ALL");
  const [priceVsSma20, setPriceVsSma20] = useState("ALL");
  const [priceVsSma50, setPriceVsSma50] = useState("ALL");
  const [priceVsSma200, setPriceVsSma200] = useState("ALL");

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    sector: "ALL",
    minPrice: "",
    maxPrice: "",
    minChange: "",
    maxChange: "",
    minVolume: "",

    trend: "ALL",
    rsiMin: "",
    rsiMax: "",
    macdSignal: "ALL",
    priceVsSma20: "ALL",
    priceVsSma50: "ALL",
    priceVsSma200: "ALL",
  });

  // =========================================================
  // FETCH SCREENER
  // =========================================================

  async function fetchScreener(targetPage = page) {
    try {
      setLoading(true);
      setError("");

      const offset = (targetPage - 1) * PAGE_SIZE;

      const result: ScreenerResponse = await getScreener({
        search: appliedFilters.search || undefined,

        sector:
          appliedFilters.sector !== "ALL"
            ? appliedFilters.sector
            : undefined,

        min_price: appliedFilters.minPrice
          ? Number(appliedFilters.minPrice)
          : undefined,

        max_price: appliedFilters.maxPrice
          ? Number(appliedFilters.maxPrice)
          : undefined,

        min_change: appliedFilters.minChange
          ? Number(appliedFilters.minChange)
          : undefined,

        max_change: appliedFilters.maxChange
          ? Number(appliedFilters.maxChange)
          : undefined,

        min_volume: appliedFilters.minVolume
          ? Number(appliedFilters.minVolume)
          : undefined,

        trend:
          appliedFilters.trend !== "ALL"
            ? appliedFilters.trend
            : undefined,

        rsi_min: appliedFilters.rsiMin
          ? Number(appliedFilters.rsiMin)
          : undefined,

        rsi_max: appliedFilters.rsiMax
          ? Number(appliedFilters.rsiMax)
          : undefined,

        macd_signal:
          appliedFilters.macdSignal !== "ALL"
            ? appliedFilters.macdSignal
            : undefined,

        price_vs_sma20:
          appliedFilters.priceVsSma20 !== "ALL"
            ? appliedFilters.priceVsSma20
            : undefined,

        price_vs_sma50:
          appliedFilters.priceVsSma50 !== "ALL"
            ? appliedFilters.priceVsSma50
            : undefined,

        price_vs_sma200:
          appliedFilters.priceVsSma200 !== "ALL"
            ? appliedFilters.priceVsSma200
            : undefined,

        limit: PAGE_SIZE,
        offset,
      });

      setStocks(result.data ?? []);
      setTotal(result.pagination?.total ?? 0);
    } catch (err) {
      console.error(err);

      setStocks([]);
      setTotal(0);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load screener data"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch ketika page / applied filters berubah
  useEffect(() => {
    fetchScreener(page);
  }, [page, appliedFilters]);

  // =========================================================
  // APPLY FILTER
  // =========================================================

  function handleApplyFilters() {
    setPage(1);

    setAppliedFilters({
      search,
      sector,
      minPrice,
      maxPrice,
      minChange,
      maxChange,
      minVolume,

      trend,
      rsiMin,
      rsiMax,
      macdSignal,
      priceVsSma20,
      priceVsSma50,
      priceVsSma200,
    });
  }

  // =========================================================
  // RESET
  // =========================================================

  function handleResetFilters() {
    setSearch("");
    setSector("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinChange("");
    setMaxChange("");
    setMinVolume("");

    setTrend("ALL");
    setRsiMin("");
    setRsiMax("");
    setMacdSignal("ALL");
    setPriceVsSma20("ALL");
    setPriceVsSma50("ALL");
    setPriceVsSma200("ALL");

    setPage(1);

    setAppliedFilters({
      search: "",
      sector: "ALL",
      minPrice: "",
      maxPrice: "",
      minChange: "",
      maxChange: "",
      minVolume: "",

      trend: "ALL",
      rsiMin: "",
      rsiMax: "",
      macdSignal: "ALL",
      priceVsSma20: "ALL",
      priceVsSma50: "ALL",
      priceVsSma200: "ALL",
    });
  }

  // =========================================================
  // FORMATTERS
  // =========================================================

  function formatPrice(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `Rp ${value.toLocaleString("id-ID")}`;
  }

  function formatVolume(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
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
  }

  function formatChange(value: number | null) {
    if (value === null || value === undefined) {
      return "—";
    }

    const sign = value > 0 ? "+" : "";

    return `${sign}${value.toFixed(2)}%`;
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-zinc-500">
            EQUITY SCREENER
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Indonesia Stock Screener
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Screen the NEXUS market-data universe using price,
            volume, sector, and daily performance.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-600">
            MARKET-DATA UNIVERSE
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            {total.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-5">

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* SEARCH */}
          <div className="lg:col-span-2">
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Search
            </label>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApplyFilters();
                }
              }}
              placeholder="Ticker or company name..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          {/* SECTOR */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Sector
            </label>

            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
            >
              <option value="ALL">All Sectors</option>
              <option value="Financials">Financials</option>
              <option value="Energy">Energy</option>
              <option value="Basic Materials">
                Basic Materials
              </option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Consumer Staples">
                Consumer Staples
              </option>
              <option value="Communication Services">
                Communication Services
              </option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>

          {/* MIN VOLUME */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Min Volume
            </label>

            <input
              type="number"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              placeholder="e.g. 1000000"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          {/* MIN PRICE */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Min Price
            </label>

            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="e.g. 1000"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          {/* MAX PRICE */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Max Price
            </label>

            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 10000"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          {/* MIN CHANGE */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Min Change %
            </label>

            <input
              type="number"
              step="0.01"
              value={minChange}
              onChange={(e) => setMinChange(e.target.value)}
              placeholder="-5"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>

          {/* MAX CHANGE */}
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
              Max Change %
            </label>

            <input
              type="number"
              step="0.01"
              value={maxChange}
              onChange={(e) => setMaxChange(e.target.value)}
              placeholder="5"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
            />
          </div>
        </div>

        {/* TECHNICAL FILTERS */}
        <div className="mt-6 border-t border-white/[0.05] pt-6">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Technical Filters
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Filter stocks using NEXUS technical analysis signals.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* TREND */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                Trend
              </label>

              <select
                value={trend}
                onChange={(e) => setTrend(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="ALL">All Trends</option>
                <option value="Bullish">Bullish</option>
                <option value="Neutral">Neutral</option>
                <option value="Bearish">Bearish</option>
              </select>
            </div>

            {/* MACD */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                MACD
              </label>

              <select
                value={macdSignal}
                onChange={(e) => setMacdSignal(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="ALL">All Signals</option>
                <option value="Bullish">Bullish</option>
                <option value="Neutral">Neutral</option>
                <option value="Bearish">Bearish</option>
              </select>
            </div>

            {/* RSI MIN */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                RSI Min
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={rsiMin}
                onChange={(e) => setRsiMin(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
              />
            </div>

            {/* RSI MAX */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                RSI Max
              </label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={rsiMax}
                onChange={(e) => setRsiMax(e.target.value)}
                placeholder="100"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20"
              />
            </div>

            {/* SMA20 */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                Price vs SMA20
              </label>

              <select
                value={priceVsSma20}
                onChange={(e) => setPriceVsSma20(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="ALL">All</option>
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>

            {/* SMA50 */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                Price vs SMA50
              </label>

              <select
                value={priceVsSma50}
                onChange={(e) => setPriceVsSma50(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="ALL">All</option>
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>

            {/* SMA200 */}
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-wider text-zinc-500">
                Price vs SMA200
              </label>

              <select
                value={priceVsSma200}
                onChange={(e) => setPriceVsSma200(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option value="ALL">All</option>
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>

          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2 border-t border-white/[0.05] pt-5">
          <button
            onClick={handleApplyFilters}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Apply Filters
          </button>

          <button
            onClick={handleResetFilters}
            className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-center">
          <p className="text-sm font-medium text-red-400">
            Failed to load screener
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {error}
          </p>

          <button
            onClick={() => fetchScreener(page)}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black"
          >
            Try Again
          </button>
        </div>
      )}

      {/* TABLE */}
      {!error && (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/30">

          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">
                Screener Results
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Showing {stocks.length} of{" "}
                {total.toLocaleString("id-ID")} tickers
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px] text-left">

              <thead className="border-b border-white/[0.05] bg-zinc-950/40">
                <tr className="text-[10px] uppercase tracking-wider text-zinc-600">

                  <th className="px-5 py-4">
                    Ticker
                  </th>

                  <th className="px-5 py-4">
                    Company
                  </th>

                  <th className="px-5 py-4">
                    Sector
                  </th>

                  <th className="px-5 py-4 text-right">
                    Price
                  </th>

                  <th className="px-5 py-4 text-right">
                    Change
                  </th>

                  <th className="px-5 py-4 text-right">
                    Volume
                  </th>

                  <th className="px-5 py-4 text-right">
                    RSI
                  </th>

                  <th className="px-5 py-4 text-right">
                    MACD
                  </th>

                  <th className="px-5 py-4">
                    Trend
                  </th>

                  <th className="px-5 py-4 text-right">
                    Data
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.035]">

                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 10 }).map((_, cell) => (
                        <td
                          key={cell}
                          className="px-5 py-4"
                        >
                          <div className="h-4 animate-pulse rounded bg-white/[0.04]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : stocks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-16 text-center"
                    >
                      <p className="text-sm text-zinc-400">
                        No stocks match the selected filters.
                      </p>

                      <p className="mt-2 text-xs text-zinc-600">
                        Try changing or resetting your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => {

                    const change =
                      stock.change_percent ?? 0;

                    const isPositive =
                      change > 0;

                    const isNegative =
                      change < 0;

                    return (
                      <tr
                        key={stock.symbol}
                        className="group transition hover:bg-white/[0.02]"
                      >

                        <td className="px-5 py-4">
                          <span className="font-semibold text-white">
                            {stock.symbol}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-zinc-300">
                            {stock.name || stock.symbol}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs text-zinc-500">
                            {stock.sector || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="font-medium text-white">
                            {formatPrice(stock.price)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={
                              isPositive
                                ? "font-medium text-emerald-400"
                                : isNegative
                                  ? "font-medium text-red-400"
                                  : "font-medium text-zinc-500"
                            }
                          >
                            {formatChange(
                              stock.change_percent
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-zinc-400">
                            {formatVolume(stock.volume)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {stock.rsi14 !== null ? (
                            <span
                              className={
                                stock.rsi14 >= 70
                                  ? "font-medium text-red-400"
                                  : stock.rsi14 <= 30
                                    ? "font-medium text-emerald-400"
                                    : "font-medium text-white"
                              }
                            >
                              {stock.rsi14.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {stock.macd !== null ? (
                            <span
                              className={
                                stock.macd > (stock.macd_signal ?? 0)
                                  ? "font-medium text-emerald-400"
                                  : stock.macd < (stock.macd_signal ?? 0)
                                    ? "font-medium text-red-400"
                                    : "font-medium text-zinc-500"
                              }
                            >
                              {stock.macd.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {stock.trend ? (
                            <span
                              className={
                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " +
                                (stock.trend === "Bullish"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : stock.trend === "Bearish"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-zinc-500/10 text-zinc-400")
                              }
                            >
                              {stock.trend}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Yahoo
                          </span>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>

          </div>

          {/* PAGINATION */}
          {!loading && stocks.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/[0.05] px-5 py-4">
              <div>
                <p className="text-xs text-zinc-500">
                  Showing{" "}
                  <span className="text-zinc-300">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>
                  {" – "}
                  <span className="text-zinc-300">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>
                  {" of "}
                  <span className="text-zinc-300">
                    {total.toLocaleString("id-ID")}
                  </span>
                  {" stocks"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Previous
                </button>

                <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-300">
                  {page} / {totalPages}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTNOTE */}
      <div className="flex flex-col justify-between gap-2 border-t border-white/[0.04] pt-5 text-[10px] uppercase tracking-wider text-zinc-700 md:flex-row">
        <span>
          NEXUS · MARKET DATA UNIVERSE
        </span>

        <span>
          PostgreSQL · Yahoo Finance · Delayed Data
        </span>
      </div>
    </div>
  );
}