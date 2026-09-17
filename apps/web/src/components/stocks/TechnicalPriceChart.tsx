"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  LineSeries,
  createChart,
} from "lightweight-charts";

type IndicatorPoint = {
  timestamp: string;
  close: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
};

type TechnicalPriceChartProps = {
  data: IndicatorPoint[];
};

const SERIES_COLORS = {
  price: "#e4e4e7",
  sma20: "#818cf8",
  sma50: "#34d399",
  sma200: "#fbbf24",
};

export default function TechnicalPriceChart({
  data,
}: TechnicalPriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data.length) return;

    const chart = createChart(el, {
      autoSize: true,
      handleScroll: false,
      handleScale: false,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontSize: 10,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        attributionLogo: false,
      },
      localization: { locale: "id-ID" },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "rgba(255,255,255,0.035)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.07)",
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.07)",
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    const priceSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: SERIES_COLORS.price,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: "#18181b",
      crosshairMarkerBackgroundColor: SERIES_COLORS.price,
    });

    const sma20Series = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: SERIES_COLORS.sma20,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const sma50Series = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: SERIES_COLORS.sma50,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const sma200Series = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: SERIES_COLORS.sma200,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const toTime = (timestamp: string) => timestamp.slice(0, 10);

    const toLineData = (
      items: IndicatorPoint[],
      key: "close" | "sma20" | "sma50" | "sma200"
    ) =>
      items
        .filter((item) => item[key] !== null)
        .map((item) => ({
          time: toTime(item.timestamp),
          value: item[key] as number,
        }));

    priceSeries.setData(toLineData(data, "close"));
    sma20Series.setData(toLineData(data, "sma20"));
    sma50Series.setData(toLineData(data, "sma50"));
    sma200Series.setData(toLineData(data, "sma200"));

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            Price Intelligence
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Price movement with moving average trends.
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[320px] w-full"
      />

      <div className="mt-4 flex flex-wrap gap-5 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-zinc-200" />
          Price
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-indigo-400" />
          SMA20
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-emerald-400" />
          SMA50
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-amber-400" />
          SMA200
        </span>
      </div>
    </div>
  );
}