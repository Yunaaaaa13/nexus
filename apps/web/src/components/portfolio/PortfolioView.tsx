"use client";

import StockLogo from "@/components/stocks/StockLogo";

export default function PortfolioView() {
  const HOLDINGS = [
    { symbol: "BBCA", name: "Bank Central Asia", shares: 15000, avgPrice: 6200, currentPrice: 6525 },
    { symbol: "BBRI", name: "Bank Rakyat Indonesia", shares: 20000, avgPrice: 4600, currentPrice: 4420 },
    { symbol: "TLKM", name: "Telkom Indonesia", shares: 12000, avgPrice: 2850, currentPrice: 2980 },
    { symbol: "BMRI", name: "Bank Mandiri", shares: 10000, avgPrice: 5900, currentPrice: 6150 },
  ];

  const totalValue = HOLDINGS.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  const totalCost = HOLDINGS.reduce((sum, h) => sum + h.shares * h.avgPrice, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">PORTFOLIO TRACKER</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Investment Portfolio</h1>
        <p className="mt-1 text-sm text-zinc-400">Track and monitor your Indonesian equity positions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
          <p className="text-xs text-zinc-500">Total Portfolio Value</p>
          <p className="mt-2 text-3xl font-bold text-white">Rp {totalValue.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-xs text-zinc-500">4 Active Holdings</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
          <p className="text-xs text-zinc-500">Unrealized P&L</p>
          <p className={`mt-2 text-3xl font-bold ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalGain >= 0 ? "+" : ""}Rp {totalGain.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{totalGainPercent.toFixed(2)}% overall return</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
          <p className="text-xs text-zinc-500">Cash Balance</p>
          <p className="mt-2 text-3xl font-bold text-white">Rp 25,000,000</p>
          <p className="mt-1 text-xs text-zinc-500">RDI BCA Sekuritas</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60">
        <div className="border-b border-white/[0.06] px-6 py-4 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">Holdings</h2>
          <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200">
            + Add Position
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-4">Ticker</th>
              <th className="px-6 py-4">Shares</th>
              <th className="px-6 py-4 text-right">Avg Cost</th>
              <th className="px-6 py-4 text-right">Current Price</th>
              <th className="px-6 py-4 text-right">Market Value</th>
              <th className="px-6 py-4 text-right">Gain / Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {HOLDINGS.map((h) => {
              const val = h.shares * h.currentPrice;
              const gain = val - h.shares * h.avgPrice;
              const gainPct = (gain / (h.shares * h.avgPrice)) * 100;
              return (
                <tr key={h.symbol} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <StockLogo symbol={h.symbol} name={h.name} />
                    <div>
                      <div className="font-bold text-white">{h.symbol}</div>
                      <div className="text-xs text-zinc-500">{h.name}</div>
                    </div>
                  </div>
                </td>
                  <td className="px-6 py-4 text-zinc-300">{h.shares.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-right text-zinc-400">Rp {h.avgPrice.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-right font-medium text-white">Rp {h.currentPrice.toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-right font-semibold text-white">Rp {val.toLocaleString("id-ID")}</td>
                  <td className={`px-6 py-4 text-right font-semibold ${gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {gain >= 0 ? "+" : ""}Rp {gain.toLocaleString("id-ID")} ({gainPct.toFixed(1)}%)
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
