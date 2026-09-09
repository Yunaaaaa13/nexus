"use client";

import { useState } from "react";
import Navbar, { TabType } from "@/components/layout/Navbar";
import MarketPulse from "@/components/market/MarketPulse";
import IndexOverview from "@/components/market/IndexOverview";
import MarketBreadth from "@/components/market/MarketBreadth";
import MarketActivity from "@/components/market/MarketActivity";
import TopMovers from "@/components/market/TopMovers";
import MarketInsight from "@/components/market/MarketInsight";
import StockTerminal from "@/components/stocks/StockTerminal";
import StockFocus from "@/components/market/StockFocus";
import ScreenerView from "@/components/screener/ScreenerView";
import PortfolioView from "@/components/portfolio/PortfolioView";
import BacktestView from "@/components/backtest/BacktestView";
import AIAnalystView from "@/components/ai/AIAnalystView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("Market");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {activeTab === "Market" && (
          <div className="space-y-10">
            {/* Hero */}
            <MarketPulse />

            {/* Index */}
            <IndexOverview />

            {/* Stock Focus */}
            <StockFocus />

            {/* Intelligence Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              <MarketBreadth />
              <MarketActivity />
            </div>

            {/* Movers */}
            <TopMovers />

            {/* Insight */}
            <MarketInsight />
          </div>
        )}

        {activeTab === "Stocks" && <StockTerminal />}

        {activeTab === "Screener" && <ScreenerView />}

        {activeTab === "Portfolio" && <PortfolioView />}

        {activeTab === "Backtest" && <BacktestView />}

        {activeTab === "AI Analyst" && <AIAnalystView />}

        {/* Footer */}
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
