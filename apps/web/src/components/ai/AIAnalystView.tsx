"use client";

import { useState } from "react";

export default function AIAnalystView() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your NEXUS AI Market Intelligence Analyst. I monitor IDX macroeconomic trends, foreign flows, and technical indicators across all 900+ Indonesian equities. How can I assist your market analysis today?",
    },
  ]);

  const handleSend = () => {
    if (!prompt.trim()) return;
    const userMsg = prompt;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg },
      {
        role: "assistant",
        content: `Analyzing ${userMsg}: Based on our PostgreSQL market records, BBCA has shown resilient accumulation around Rp 6,500 with significant domestic institutional absorption. Foreign flows remain net positive across Tier-1 banking. Keep an eye on Bank Indonesia's upcoming rate decision as a key catalyst.`,
      },
    ]);
    setPrompt("");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-indigo-400">NEXUS INTELLIGENCE</span>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
            AI Copilot
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">AI Market Analyst</h1>
        <p className="mt-1 text-sm text-zinc-400">Real-time market insights powered by proprietary Indonesian financial intelligence models</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Market Sentiment Summary */}
        <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Macro Market Sentiment</h2>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <span className="text-xs font-semibold text-emerald-400">Sentiment: Moderately Bullish</span>
            <p className="mt-1 text-xs text-zinc-400 leading-5">
              Strong banking sector balance sheets and foreign capital inflows are offsetting regional currency volatility.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 text-zinc-400 border-b border-white/[0.04]">
              <span>Rupiah FX (USD/IDR)</span>
              <span className="text-white font-medium">16,140</span>
            </div>
            <div className="flex justify-between py-1 text-zinc-400 border-b border-white/[0.04]">
              <span>BI 7-Day Reverse Repo</span>
              <span className="text-white font-medium">6.00%</span>
            </div>
            <div className="flex justify-between py-1 text-zinc-400">
              <span>IDX Tier-1 Liquidity</span>
              <span className="text-emerald-400 font-medium">Healthy</span>
            </div>
          </div>
        </div>

        {/* Chat / Query Panel */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-white/[0.06] bg-zinc-900/60 h-[480px]">
          <div className="border-b border-white/[0.06] px-6 py-3.5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Analysis Conversation</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white text-black font-medium"
                      : "border border-white/[0.08] bg-zinc-950 text-zinc-300"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] p-4 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about Indonesian stocks, valuation, or macro..."
              className="flex-1 rounded-xl border border-white/[0.08] bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition cursor-pointer"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
