export default function Navbar() {
  return (
    <nav className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">
            N
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.2em]">NEXUS</div>
            <div className="text-[9px] tracking-[0.18em] text-zinc-600">
              MARKET INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          <a
            href="/"
            className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-white"
          >
            Market
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            Stocks
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            Screener
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            Portfolio
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
          >
            Backtest
          </a>
          <a
            href="#"
            className="ml-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-zinc-400 transition hover:border-white/[0.15] hover:text-white"
          >
            AI Analyst
          </a>
        </div>

        {/* Market status */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-500">Market Data</span>
        </div>
      </div>
    </nav>
  );
}
