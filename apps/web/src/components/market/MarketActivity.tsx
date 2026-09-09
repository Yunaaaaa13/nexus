const metrics = [
  {
    label: "Trading Value",
    value: "Rp 12.7T",
  },
  {
    label: "Trading Volume",
    value: "18.4B",
  },
  {
    label: "Foreign Flow",
    value: "+Rp 342B",
  },
  {
    label: "Active Stocks",
    value: "487",
  },
];

export default function MarketActivity() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-zinc-600">
        MARKET ACTIVITY
      </p>
      <h2 className="mt-1 text-lg font-semibold">
        Trading Activity
      </h2>

      <div className="mt-6 divide-y divide-white/[0.05]">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between py-3.5"
          >
            <span className="text-sm text-zinc-500">
              {metric.label}
            </span>
            <span className="text-sm font-semibold">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
