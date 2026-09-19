"use client";

import { useEffect, useState } from "react";
import { getStock, getStockUniverse } from "@/lib/api";
import StockPickerModal, {
  type StockOption,
} from "@/components/ui/StockPickerModal";

interface StockData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  source: string;
}

export default function StockFocus() {
  const [symbol, setSymbol] = useState("BBCA");
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  const [stockList, setStockList] = useState<
    StockOption[]
  >([]);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    getStockUniverse({ limit: 1000 })
      .then((res) => {
        if (!active) return;
        setStockList(res.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load stock list:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getStock(symbol)
      .then((response) => {
        if (!active) return;
        setData(response.data);
      })
      .catch((error) => {
        console.error(`Failed to load ${symbol}:`, error);
        if (active) {
          setData(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  const selectedStock = stockList.find(
    (item) => item.symbol === symbol
  );

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            STOCK FOCUS
          </p>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-1 flex items-center gap-3 rounded-lg transition hover:opacity-80"
          >
            <span className="text-lg font-semibold">
              {symbol}
            </span>

            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 text-zinc-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 4.5L6 8l3.5-3.5" />
            </svg>
          </button>

          {selectedStock &&
            selectedStock.name !== symbol && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {selectedStock.name}
              </p>
            )}
        </div>

        <span className="text-xs text-zinc-600">Yahoo Finance</span>
      </div>

      {loading ? (
        <div className="mt-6 h-20 animate-pulse rounded-xl bg-white/[0.04]" />
      ) : data ? (
        <>
          <div className="mt-6">
            <p className="text-4xl font-semibold">
              Rp {data.price.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-zinc-600">Delayed market data</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Metric label="Open" value={data.open} />
            <Metric label="High" value={data.high} />
            <Metric label="Low" value={data.low} />
            <Metric label="Volume" value={data.volume} />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-red-400">
          Failed to load {symbol} data
        </p>
      )}

      <StockPickerModal
        open={pickerOpen}
        stocks={stockList}
        selectedSymbol={symbol}
        onSelect={(stock) => {
          setSymbol(stock.symbol);
          setLoading(true);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">
        {value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}