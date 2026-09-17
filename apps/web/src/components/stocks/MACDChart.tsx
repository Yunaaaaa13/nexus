"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
} from "lightweight-charts";

type MACDData = {
  timestamp: string;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
};

type MACDChartProps = {
  data: MACDData[];
};

const MACD_LINE = "#38bdf8";
const SIGNAL_LINE = "#fbbf24";

export default function MACDChart({
  data,
}: MACDChartProps) {
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
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.15 },
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

    const macdSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: MACD_LINE,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: "#18181b",
      crosshairMarkerBackgroundColor: MACD_LINE,
    });

    const signalSeries = chart.addSeries(LineSeries, {
      lineWidth: 1,
      color: SIGNAL_LINE,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: { type: "price" },
      base: 0,
    });

    macdSeries.setData(
      data
        .filter((item) => item.macd !== null)
        .map((item) => ({
          time: item.timestamp.slice(0, 10),
          value: item.macd as number,
        }))
    );

    signalSeries.setData(
      data
        .filter((item) => item.macd_signal !== null)
        .map((item) => ({
          time: item.timestamp.slice(0, 10),
          value: item.macd_signal as number,
        }))
    );

    macdSeries.createPriceLine({
      price: 0,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "Zero",
    });

    histogramSeries.setData(
      data
        .filter((item) => item.macd_histogram !== null)
        .map((item) => {
          const value = item.macd_histogram as number;
          return {
            time: item.timestamp.slice(0, 10),
            value,
            color:
              value >= 0
                ? "#22c55e"
                : "#ef4444",
          };
        })
    );

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">
          MACD
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Moving Average Convergence Divergence momentum.
        </p>
      </div>

      <div ref={containerRef} className="h-[220px] w-full" />

      <div className="mt-3 flex flex-wrap gap-5 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-sky-400" />
          MACD
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-amber-400" />
          Signal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400/70" />
          Histogram (+)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-rose-400/70" />
          Histogram (−)
        </span>
      </div>
    </div>
  );
}