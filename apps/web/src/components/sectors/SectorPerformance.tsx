"use client";

type Sector = {
  sector: string;
  stock_count: number;
  advancing: number;
  declining: number;
  unchanged: number;
  avg_change_percent: number;
  breadth_percent: number;
  total_volume: number;
  momentum: string;
};

type Props = {
  data: Sector[];
};

function formatVolume(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toString();
}

export default function SectorPerformance({ data }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-base font-semibold text-white">
          Sector Performance
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          Daily performance and market breadth by sector.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-zinc-950/40 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3 font-medium">Sector</th>
              <th className="px-5 py-3 text-right font-medium">
                Stocks
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Performance
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Breadth
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Adv / Dec
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Volume
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Momentum
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.04]">
            {data.map((sector) => {
              const positive =
                sector.avg_change_percent > 0;

              const negative =
                sector.avg_change_percent < 0;

              return (
                <tr
                  key={sector.sector}
                  className="last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">
                      {sector.sector}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right text-zinc-400">
                    {sector.stock_count}
                  </td>

                  <td
                    className={`px-5 py-4 text-right font-medium ${
                      positive
                        ? "text-emerald-400"
                        : negative
                        ? "text-rose-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {sector.avg_change_percent.toFixed(2)}%
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="text-zinc-300">
                      {sector.breadth_percent.toFixed(1)}%
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right text-zinc-400">
                    {sector.advancing} / {sector.declining}
                  </td>

                  <td className="px-5 py-4 text-right text-zinc-400">
                    {formatVolume(sector.total_volume)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        sector.momentum === "Positive"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : sector.momentum === "Negative"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {sector.momentum}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}