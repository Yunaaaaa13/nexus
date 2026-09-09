"use client";

export default function BacktestView() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">QUANTITATIVE LAB</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Strategy Backtester</h1>
        <p className="mt-1 text-sm text-zinc-400">Test quantitative trading strategies against stored historical IDX candles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Settings panel */}
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Strategy Parameters</h2>

          <div>
            <label className="text-xs text-zinc-400">Target Asset</label>
            <select className="mt-1 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none">
              <option>BBCA - Bank Central Asia</option>
              <option>BBRI - Bank Rakyat Indonesia</option>
              <option>IHSG - Composite Index</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Strategy Model</label>
            <select className="mt-1 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none">
              <option>Dual SMA (20 / 50 Day Crossover)</option>
              <option>RSI Momentum (30 / 70 Oversold/Overbought)</option>
              <option>Bollinger Band Mean-Reversion</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Initial Capital</label>
            <input
              type="text"
              defaultValue="Rp 100,000,000"
              className="mt-1 w-full rounded-xl border border-white/[0.08] bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <button className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition cursor-pointer">
            Run Simulation
          </button>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Cumulative Return</span>
              <p className="mt-1 text-2xl font-bold text-emerald-400">+24.8%</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Win Rate</span>
              <p className="mt-1 text-2xl font-bold text-white">68.4%</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Max Drawdown</span>
              <p className="mt-1 text-2xl font-bold text-red-400">-6.2%</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total Trades</span>
              <p className="mt-1 text-2xl font-bold text-white">19</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
            <h3 className="text-sm font-semibold text-white">Simulation Equity Curve (1Y Historical)</h3>
            <p className="mt-1 text-xs text-zinc-500">Based on 244 candles ingested into PostgreSQL</p>
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-zinc-950 text-xs text-zinc-500">
              Equity Curve Visualization Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
