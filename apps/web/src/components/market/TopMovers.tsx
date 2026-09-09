const gainers = [
  ["BBCA", "+2.41%"],
  ["ANTM", "+1.92%"],
  ["BMRI", "+1.54%"],
];

const losers = [
  ["GOTO", "-3.12%"],
  ["TLKM", "-2.41%"],
  ["UNVR", "-1.87%"],
];

function StockRow({
  symbol,
  change,
  positive,
}: {
  symbol: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">
        {symbol}
      </span>
      <span
        className={
          positive
            ? "text-xs font-medium text-emerald-400"
            : "text-xs font-medium text-red-400"
        }
      >
        {change}
      </span>
    </div>
  );
}

export default function TopMovers() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            TOP MOVERS
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Market Leaders
          </h2>
        </div>

        <button className="text-xs text-zinc-600 transition hover:text-white">
          View all →
        </button>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Gainers
          </p>

          <div className="mt-2 divide-y divide-white/[0.05]">
            {gainers.map(([symbol, change]) => (
              <StockRow
                key={symbol}
                symbol={symbol}
                change={change}
                positive
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Losers
          </p>

          <div className="mt-2 divide-y divide-white/[0.05]">
            {losers.map(([symbol, change]) => (
              <StockRow
                key={symbol}
                symbol={symbol}
                change={change}
                positive={false}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
