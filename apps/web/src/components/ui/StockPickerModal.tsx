"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type StockOption = {
  symbol: string;
  name: string;
  sector: string | null;
};

type Props = {
  open: boolean;
  stocks: StockOption[];
  loading?: boolean;
  selectedSymbol?: string;
  onSelect: (stock: StockOption) => void;
  onClose: () => void;
};

export default function StockPickerModal({
  open,
  ...props
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={props.onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <StockPickerPanel {...props} />
      </div>
    </div>
  );
}

function StockPickerPanel({
  stocks,
  loading = false,
  selectedSymbol,
  onSelect,
  onClose,
}: Omit<Props, "open">) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);

    return () =>
      document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toUpperCase();

    if (!keyword) {
      return stocks;
    }

    return stocks.filter(
      (item) =>
        item.symbol.toUpperCase().includes(keyword) ||
        item.name.toUpperCase().includes(keyword)
    );
  }, [stocks, query]);

  return (
    <>
      {/* HEADER */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Equity Universe
            </p>

            <h3 className="mt-0.5 text-sm font-semibold text-white">
              Select Stock
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            <svg
              viewBox="0 0 14 14"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticker or company name..."
          className="mt-3 w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20"
        />
      </div>

      {/* LIST */}
      <div className="max-h-[60vh] overflow-y-auto py-1">
        {loading && stocks.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs text-zinc-600">
            Loading stock universe...
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-xs text-zinc-600">
            No stocks match your search.
          </p>
        ) : (
          filtered.map((item) => {
            const isSelected =
              item.symbol === selectedSymbol;

            return (
              <button
                key={item.symbol}
                type="button"
                onClick={() => onSelect(item)}
                className={
                  "flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-white/[0.04] " +
                  (isSelected
                    ? "bg-white/[0.04]"
                    : "")
                }
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {item.symbol}
                  </span>

                  {isSelected && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                      Selected
                    </span>
                  )}
                </div>

                <span className="truncate text-xs text-zinc-500">
                  {item.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-white/[0.06] px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-600">
        {filtered.length} of{" "}
        {stocks.length.toLocaleString("id-ID")} stocks
      </div>
    </>
  );
}