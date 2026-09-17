"use client";

type Sector = {
  sector: string;
  avg_change_percent: number;
  breadth_percent: number;
  momentum: string;
};

type Props = {
  data: Sector[];
};

export default function SectorRotation({ data }: Props) {
  if (!data.length) {
    return null;
  }

  const maxPerformance = Math.max(
    ...data.map((item) =>
      Math.abs(item.avg_change_percent)
    ),
    1
  );

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-zinc-900/60">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-base font-semibold text-white">
          Sector Momentum
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          Relative sector performance and market breadth.
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => {
          const positive =
            item.avg_change_percent >= 0;

          const width =
            Math.min(
              Math.abs(item.avg_change_percent) /
                maxPerformance,
              1
            ) * 100;

          return (
            <div
              key={item.sector}
              className="rounded-xl border border-white/[0.06] bg-zinc-950/60 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {item.sector}
                </span>

                <span
                  className={`text-sm font-semibold ${
                    positive
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {positive ? "+" : ""}
                  {item.avg_change_percent.toFixed(2)}%
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${
                    positive
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                  }`}
                  style={{
                    width: `${width}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Breadth
                </span>

                <span className="text-zinc-300">
                  {item.breadth_percent.toFixed(1)}%
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Momentum
                </span>

                <span
                  className={
                    item.momentum === "Positive"
                      ? "text-emerald-400"
                      : item.momentum === "Negative"
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }
                >
                  {item.momentum}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}