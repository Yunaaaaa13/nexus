"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  LineSeries,
  createChart,
} from "lightweight-charts";

type RSIData = {
  timestamp: string;
  rsi14: number | null;
};

type RSIChartProps = {
  data: RSIData[];
};

const RSI_LINE = "#a78bfa";

export default function RSIChart({
  data,
}: RSIChartProps) {
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
        scaleMargins: { top: 0.05, bottom: 0.05 },
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

    const rsiSeries = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: RSI_LINE,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: "#18181b",
      crosshairMarkerBackgroundColor: RSI_LINE,
    });

    rsiSeries.setData(
      data
        .filter((item) => item.rsi14 !== null)
        .map((item) => ({
          time: item.timestamp.slice(0, 10),
          value: item.rsi14 as number,
        }))
    );

    rsiSeries.createPriceLine({
      price: 70,
      color: "#dc2626",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "70",
    });

    rsiSeries.createPriceLine({
      price: 30,
      color: "#16a34a",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "30",
    });

    rsiSeries.createPriceLine({
      price: 50,
      color: "#52525b",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: false,
      title: "50",
    });

    chart.priceScale("right").setVisibleRange({ from: 0, to: 100 });

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white">RSI 14</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Relative Strength Index momentum indicator.
        </p>
      </div>

      <div ref={containerRef} className="h-[200px] w-full" />

      <div className="mt-3 grid grid-cols-3 text-xs text-zinc-500">
        <span>
          Oversold
          <br />
          &lt; 30
        </span>

        <span className="text-center">
          Neutral
          <br />
          30–70
        </span>

        <span className="text-right">
          Overbought
          <br />
          &gt; 70
        </span>
      </div>
    </div>
  );
}