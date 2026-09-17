"use client";

import { useState } from "react";
import { getStockLogoSources } from "@/lib/stockLogo";

type StockLogoProps = {
  symbol: string;
  name?: string;
  size?: "sm" | "md" | "lg";
};

export default function StockLogo({
  symbol,
  name,
  size = "md",
}: StockLogoProps) {
  const ticker = symbol.toUpperCase().trim();
  const sources = getStockLogoSources(ticker);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const logo = sources.find((source) => !failedSources.includes(source));

  const sizeClass = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  }[size];

  const padClass = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1",
  }[size];

  if (!logo) {
    return (
      <div
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-950 text-xs font-bold text-white`}
      >
        {ticker.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-white/15`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt={`${name ?? ticker} logo`}
        className={`${padClass} h-full w-full object-contain`}
        loading="lazy"
        onError={() => {
          setFailedSources((current) =>
            current.includes(logo) ? current : [...current, logo],
          );
        }}
      />
    </div>
  );
}
