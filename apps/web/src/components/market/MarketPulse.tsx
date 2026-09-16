"use client";

import { useCallback, useEffect, useState } from "react";
import { getIndexHistory } from "@/lib/api";
import PulseHeader from "./PulseHeader";
import PriceChart, { type Period } from "./PriceChart";
import MarketMeta from "./MarketMeta";
import type { Candle } from "./IndexAreaChart";

interface MarketDataResponse {
  symbol: string;
  name: string;
  period: string;
  interval: string;
  market_status: "Open" | "Closed";
  latest_price: number;
  change: number;
  change_percent: number;
  last_updated: string;
  candles: Candle[];
}

export default function MarketPulse() {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [period, setPeriod] = useState<Period>("1D");
  const [loading, setLoading] = useState(true);

  const loadMarketData = useCallback(async () => {
    try {
      const response = await getIndexHistory("IHSG", period);
      if (response && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Failed to load IHSG data:", error);
    }
  }, [period]);

  useEffect(() => {
    // Fetech async: seluruh setState terjadi setelah await promise,
    // bukan sinkron di dalam effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMarketData().finally(() => setLoading(false));

    const id = window.setInterval(loadMarketData, 60000);

    return () => window.clearInterval(id);
  }, [loadMarketData]);

  const handlePeriodChange = (p: Period) => {
    if (p === period) return;
    setLoading(true);
    setPeriod(p);
  };

  const isPositive = (data?.change ?? 0) >= 0;

  return (
    <section className="w-full overflow-clip rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <PulseHeader
        latestPrice={data?.latest_price ?? null}
        change={data?.change ?? null}
        changePercent={data?.change_percent ?? null}
        marketStatus={data?.market_status ?? null}
        loading={loading}
      />

      <PriceChart
        candles={data?.candles ?? []}
        interval={data?.interval ?? ""}
        positive={isPositive}
        period={period}
        onPeriodChange={handlePeriodChange}
        loading={loading}
        onRetry={() => {
          setLoading(true);
          loadMarketData();
        }}
      />

      <MarketMeta lastUpdated={data?.last_updated ?? null} />
    </section>
  );
}