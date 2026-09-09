export default function MarketInsight() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 md:p-7">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
              MARKET INSIGHT
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              What&apos;s happening?
            </h2>
          </div>

          <div className="rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-zinc-600">
            NEXUS
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-base leading-7 text-zinc-400">
          Market breadth is currently mixed, with declining stocks slightly outnumbering advancing stocks. Large-cap names remain the primary area to watch as market participation develops.
        </p>

        <button className="mt-6 text-xs font-medium text-white transition hover:text-zinc-400">
          View detailed analysis →
        </button>
      </div>
    </section>
  );
}
