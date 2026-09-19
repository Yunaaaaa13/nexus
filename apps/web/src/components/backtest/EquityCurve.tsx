"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
} from "lightweight-charts";

type EquityPoint = {
  timestamp: string;
  equity: number;
};

type Props = {
  data: EquityPoint[];
};

export default function EquityCurve({
  data,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) {
      return;
    }

    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 360,

      layout: {
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: "#71717a",
        attributionLogo: false,
      },

      grid: {
        vertLines: {
          color: "transparent",
        },
        horzLines: {
          color: "rgba(255,255,255,0.035)",
        },
      },

      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.07)",
      },

      timeScale: {
        borderColor: "rgba(255,255,255,0.07)",
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },

      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: "#a78bfa",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: "#18181b",
      crosshairMarkerBackgroundColor: "#a78bfa",
    });

    const chartData = data
      .map((item) => ({
        time: item.timestamp.slice(
          0,
          10
        ),
        value: Number(item.equity),
      }))
      .filter(
        (item, index, array) =>
          index === 0 ||
          item.time !== array[index - 1].time
      );

    series.setData(chartData);

    chart.timeScale().fitContent();

    const resizeObserver =
      new ResizeObserver(() => {
        chart.applyOptions({
          width: container.clientWidth,
        });
      });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex h-[360px] items-center justify-center text-sm text-zinc-500">
        No equity data available.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
    />
  );
}