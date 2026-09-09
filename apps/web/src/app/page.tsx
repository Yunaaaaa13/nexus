export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <header className="mb-10">
          <p className="text-sm font-medium tracking-[0.25em] text-zinc-500">
            NEXUS
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Market Intelligence
          </h1>

          <p className="mt-2 text-zinc-400">
            Indonesian stock market overview
          </p>
        </header>

        {/* Market Overview */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Market Overview
            </h2>

            <span className="text-sm text-zinc-500">
              Live delayed data
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {/* IHSG */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-400">
                IHSG
              </p>

              <p className="mt-3 text-3xl font-bold">
                6,675.13
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                IDX Composite
              </p>
            </div>

            {/* LQ45 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-400">
                LQ45
              </p>

              <p className="mt-3 text-3xl font-bold">
                —
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Coming soon
              </p>
            </div>

            {/* IDX30 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-400">
                IDX30
              </p>

              <p className="mt-3 text-3xl font-bold">
                —
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Coming soon
              </p>
            </div>

          </div>
        </section>

        {/* Stock Focus */}
        <section className="mt-10">

          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Stock Focus
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Selected Indonesian equities
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-zinc-400">
                  BBCA
                </p>

                <p className="mt-2 text-3xl font-bold">
                  Rp 6,525
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Bank Central Asia
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-zinc-500">
                  Volume
                </p>

                <p className="mt-1 font-semibold">
                  139.3M
                </p>
              </div>

            </div>

            {/* Chart Placeholder */}
            <div className="mt-8 flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950">

              <div className="text-center">
                <p className="text-zinc-400">
                  Price Chart
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Interactive chart coming next
                </p>
              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}