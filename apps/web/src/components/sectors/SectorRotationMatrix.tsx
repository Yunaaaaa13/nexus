"use client";

type Sector = {
  sector: string;
  performance_20d: number;
  breadth_percent: number;
  rotation_state: string;
};

type Props = {
  data: Sector[];
  performanceMedian: number;
  breadthMedian: number;
};

const stateDescription: Record<string, string> = {
  Leading: "Strong performance and broad participation",
  Improving: "Performance improving with limited breadth",
  Lagging: "Weak performance and weak participation",
  Weakening: "Broad participation but weakening performance",
};

export default function SectorRotationMatrix({
  data,
  performanceMedian,
  breadthMedian,
}: Props) {
  if (!data.length) {
    return (
      <section className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-6">
        <p className="text-sm text-zinc-500">
          No sector rotation data available.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/[0.06] bg-zinc-900/60">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-base font-semibold text-white">
          Sector Rotation
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          Relative 20-day performance versus sector breadth.
        </p>
      </div>

      <div className="p-5">
        <div className="relative h-[460px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20">

          {/* Vertical axis */}
          <div className="absolute bottom-0 left-1/2 top-0 border-l border-dashed border-white/10" />

          {/* Horizontal axis */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/10" />

          {/* Quadrant labels */}
          <div className="absolute left-4 top-4">
            <p className="text-xs font-medium text-zinc-400">
              Improving
            </p>
            <p className="mt-1 max-w-[150px] text-[11px] text-zinc-600">
              Higher performance, lower breadth
            </p>
          </div>

          <div className="absolute right-4 top-4 text-right">
            <p className="text-xs font-medium text-emerald-400">
              Leading
            </p>
            <p className="mt-1 max-w-[150px] text-[11px] text-zinc-600">
              Higher performance, higher breadth
            </p>
          </div>

          <div className="absolute bottom-4 left-4">
            <p className="text-xs font-medium text-rose-400">
              Lagging
            </p>
            <p className="mt-1 max-w-[150px] text-[11px] text-zinc-600">
              Lower performance, lower breadth
            </p>
          </div>

          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-xs font-medium text-amber-400">
              Weakening
            </p>
            <p className="mt-1 max-w-[150px] text-[11px] text-zinc-600">
              Lower performance, higher breadth
            </p>
          </div>

          {/* Sector points */}
          {data.map((item) => {
            const xRange = Math.max(
              ...data.map((sector) =>
                Math.abs(
                  sector.breadth_percent -
                    breadthMedian
                )
              ),
              10
            );

            const yRange = Math.max(
              ...data.map((sector) =>
                Math.abs(
                  sector.performance_20d -
                    performanceMedian
                )
              ),
              10
            );

            const x =
              50 +
              (
                (item.breadth_percent -
                  breadthMedian) /
                xRange
              ) *
                35;

            const y =
              50 -
              (
                (item.performance_20d -
                  performanceMedian) /
                yRange
              ) *
                35;

            const clampedX = Math.max(
              8,
              Math.min(92, x)
            );

            const clampedY = Math.max(
              10,
              Math.min(90, y)
            );

            const stateClass =
              item.rotation_state === "Leading"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : item.rotation_state === "Improving"
                ? "border-blue-400/40 bg-blue-400/10 text-blue-300"
                : item.rotation_state === "Lagging"
                ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300";

            return (
              <div
                key={item.sector}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-medium ${stateClass}`}
                style={{
                  left: `${clampedX}%`,
                  top: `${clampedY}%`,
                }}
                title={`${item.sector} — ${stateDescription[item.rotation_state]}`}
              >
                {item.sector}
              </div>
            );
          })}

          {/* Axis labels */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600">
            Breadth →
          </div>

          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-zinc-600">
            20D Performance →
          </div>
        </div>
      </div>
    </section>
  );
}