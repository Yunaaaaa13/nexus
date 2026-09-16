"use client";

interface MarketMetaProps {
  lastUpdated: string | null;
}

export default function MarketMeta({ lastUpdated }: MarketMetaProps) {
  const label = lastUpdated
    ? new Date(lastUpdated).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.05] px-6 py-3 md:px-8">
      <span className="text-[11px] text-zinc-600">Delayed Market Data</span>
      {label && (
        <span className="text-[11px] tabular-nums text-zinc-600">
          Updated {label} WIB
        </span>
      )}
    </div>
  );
}