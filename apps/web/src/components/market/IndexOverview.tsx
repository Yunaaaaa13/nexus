const indices = [
  {
    name: "IHSG",
    value: "6,675.13",
    change: "-0.38%",
    direction: "down",
  },
  {
    name: "LQ45",
    value: "—",
    change: "—",
    direction: "neutral",
  },
  {
    name: "IDX30",
    value: "—",
    change: "—",
    direction: "neutral",
  },
];

export default function IndexOverview() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
            MARKET INDICES
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            Index Overview
          </h2>
        </div>

        <span className="text-xs text-zinc-600">
          Today
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {indices.map((index) => (
          <div
            key={index.name}
            className="group rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 transition hover:border-white/[0.12] hover:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-zinc-500">
                {index.name}
              </span>

              <span className="text-[10px] text-zinc-700">
                IDX
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <span className="text-2xl font-semibold">
                {index.value}
              </span>

              <span
                className={
                  index.direction === "down"
                    ? "text-xs font-medium text-red-400"
                    : "text-xs text-zinc-600"
                }
              >
                {index.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
