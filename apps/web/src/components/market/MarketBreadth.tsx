export default function MarketBreadth() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            MARKET BREADTH
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Participation
          </h2>
        </div>

        <span className="text-xs text-zinc-600">
          All Stocks
        </span>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xl font-semibold">
            184
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">
            Advancing
          </p>
        </div>

        <div>
          <p className="text-2xl font-semibold">
            231
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">
            Declining
          </p>
        </div>

        <div>
          <p className="text-2xl font-semibold">
            72
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-600">
            Unchanged
          </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="w-[38%] bg-emerald-500/70" />
          <div className="w-[47%] bg-red-500/70" />
          <div className="w-[15%] bg-zinc-600" />
        </div>

        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-zinc-700">
          <span>Advancing</span>
          <span>Declining</span>
        </div>
      </div>
    </section>
  );
}
