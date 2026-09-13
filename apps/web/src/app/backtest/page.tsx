"use client";

import Navbar from "@/components/layout/Navbar";
import BacktestView from "@/components/backtest/BacktestView";

export default function BacktestPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab="Backtest" />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <BacktestView />

        <footer className="mt-16 border-t border-white/[0.05] py-6">
          <div className="flex flex-col justify-between gap-2 text-[10px] tracking-wider text-zinc-600 md:flex-row">
            <span>NEXUS · INDONESIAN MARKET INTELLIGENCE</span>
            <span>DATA LAYER v0.1 · CONNECTED TO POSTGRESQL</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
