"use client";

const SCREENER_STOCKS = [
  { symbol: "BBCA", name: "Bank Central Asia", sector: "Financials", price: 6525, pe: 18.4, cap: "798T", change: "+1.2%" },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia", sector: "Financials", price: 4420, pe: 11.2, cap: "669T", change: "-0.5%" },
  { symbol: "BMRI", name: "Bank Mandiri", sector: "Financials", price: 6150, pe: 10.8, cap: "574T", change: "+1.5%" },
  { symbol: "TLKM", name: "Telkom Indonesia", sector: "Telecom", price: 2980, pe: 12.6, cap: "295T", change: "-2.4%" },
  { symbol: "ASII", name: "Astra International", sector: "Automotive", price: 4890, pe: 6.8, cap: "197T", change: "+0.8%" },
  { symbol: "ANTM", name: "Aneka Tambang", sector: "Basic Materials", price: 1480, pe: 14.2, cap: "35T", change: "+1.9%" },
  { symbol: "GOTO", name: "GoTo Gojek Tokopedia", sector: "Technology", price: 62, pe: -12.4, cap: "74T", change: "-3.1%" },
];

export default function ScreenerView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">EQUITY SCREENER</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Indonesia Stock Screener</h1>
          <p className="mt-1 text-sm text-zinc-400">Filter and evaluate 900+ IDX listed companies</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search ticker or name..."
            className="rounded-xl border border-white/[0.08] bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none"
          />
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-zinc-950/60 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-4">Ticker</th>
              <th className="px-6 py-4">Company Name</th>
              <th className="px-6 py-4">Sector</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-right">Change</th>
              <th className="px-6 py-4 text-right">P/E</th>
              <th className="px-6 py-4 text-right">Market Cap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {SCREENER_STOCKS.map((stock) => (
              <tr key={stock.symbol} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-bold text-white">{stock.symbol}</td>
                <td className="px-6 py-4 text-zinc-300">{stock.name}</td>
                <td className="px-6 py-4 text-zinc-500">{stock.sector}</td>
                <td className="px-6 py-4 text-right font-medium text-white">Rp {stock.price.toLocaleString("id-ID")}</td>
                <td className={`px-6 py-4 text-right font-medium ${stock.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                  {stock.change}
                </td>
                <td className="px-6 py-4 text-right text-zinc-400">{stock.pe}</td>
                <td className="px-6 py-4 text-right text-zinc-300 font-semibold">{stock.cap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
