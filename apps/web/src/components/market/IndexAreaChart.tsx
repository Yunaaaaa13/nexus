"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndexAreaChartProps {
  candles: Candle[];
  interval: string;
  positive: boolean;
}

const INTRADAY_INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "4h"]);

const PALETTE = {
  up: {
    line: "#34d399",
    fill: "rgba(52, 211, 153, 0.10)",
  },
  down: {
    line: "#fb7185",
    fill: "rgba(251, 113, 133, 0.10)",
  },
};

export default function IndexAreaChart({
  candles,
  interval,
  positive,
}: IndexAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
      localization: {
        locale: "id-ID",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "rgba(255,255,255,0.035)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.07)",
        scaleMargins: { top: 0.12, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.07)",
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255,255,255,0.15)",
          labelBackgroundColor: "#27272a",
        },
        horzLine: {
          color: "rgba(255,255,255,0.15)",
          labelBackgroundColor: "#27272a",
        },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: "#18181b",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param) => {
      if (!seriesRef.current) return;
      const point = param.seriesData.get(seriesRef.current) as
        | LineData
        | undefined;
      setHover(point ? point.value : null);
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || candles.length === 0) return;

    const isIntraday = INTRADAY_INTERVALS.has(interval);

    series.setData(
      candles.map((c) =>
        isIntraday
          ? { time: c.timestamp as UTCTimestamp, value: c.close }
          : { time: c.time, value: c.close }
      )
    );

    chart.applyOptions({
      timeScale: {
        timeVisible: isIntraday,
        secondsVisible: false,
      },
    });

    chart.timeScale().fitContent();
    setHover(null);
  }, [candles, interval]);

  useEffect(() => {
    const palette = positive ? PALETTE.up : PALETTE.down;
    seriesRef.current?.applyOptions({
      lineColor: palette.line,
      topColor: palette.fill,
      bottomColor: "rgba(0, 0, 0, 0)",
      crosshairMarkerBackgroundColor: palette.line,
    });
  }, [positive]);

  const last = candles[candles.length - 1];
  const displayValue = hover ?? last?.close ?? null;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-2 z-10">
        <span
          className={`text-sm font-medium tabular-nums ${
            positive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {displayValue !== null
            ? displayValue.toLocaleString("id-ID", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—"}
        </span>
      </div>
    </div>
  );
}