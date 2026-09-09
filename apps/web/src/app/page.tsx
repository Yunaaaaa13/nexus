import Navbar from "@/components/layout/Navbar";
import MarketPulse from "@/components/market/MarketPulse";
import IndexOverview from "@/components/market/IndexOverview";
import MarketBreadth from "@/components/market/MarketBreadth";
import MarketActivity from "@/components/market/MarketActivity";
import TopMovers from "@/components/market/TopMovers";
import MarketInsight from "@/components/market/MarketInsight";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Hero */}
        <MarketPulse />

        {/* Index */}
        <div className="mt-10">
          <IndexOverview />
        </div>

        {/* Intelligence Grid */}
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <MarketBreadth />
          <MarketActivity />
        </div>

        {/* Movers */}
        <div className="mt-4">
          <TopMovers />
        </div>

        {/* Insight */}
        <div className="mt-4">
          <MarketInsight />
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/[0.05] py-6">
          <div className="flex flex-col justify-between gap-2 text-[10px] tracking-wider text-zinc-700 md:flex-row">
            <span>NEXUS · INDONESIAN MARKET INTELLIGENCE</span>
            <span>DATA LAYER v0.1</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
