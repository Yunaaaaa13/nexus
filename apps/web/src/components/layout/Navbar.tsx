"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabType =
  | "Market"
  | "Stocks"
  | "Screener"
  | "Portfolio"
  | "Backtest"
  | "AI Analyst";

interface NavItem {
  name: TabType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Market", href: "/" },
  { name: "Stocks", href: "/stocks" },
  { name: "Screener", href: "/screener" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Backtest", href: "/backtest" },
  { name: "AI Analyst", href: "/ai-analyst" },
];

interface NavbarProps {
  activeTab?: TabType;
  onSelectTab?: (tab: TabType) => void;
}

export default function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getEffectiveTab = (): TabType => {
    if (pathname === "/") return "Market";
    if (pathname.startsWith("/stocks")) return "Stocks";
    if (pathname.startsWith("/screener")) return "Screener";
    if (pathname.startsWith("/portfolio")) return "Portfolio";
    if (pathname.startsWith("/backtest")) return "Backtest";
    if (pathname.startsWith("/ai-analyst")) return "AI Analyst";
    return activeTab || "Market";
  };

  const currentTab = getEffectiveTab();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => onSelectTab?.("Market")}
          className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-black">
            N
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.2em] text-white">NEXUS</div>
            <div className="text-[9px] tracking-[0.18em] text-zinc-500">
              MARKET INTELLIGENCE
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.name;
            const isAI = item.name === "AI Analyst";

            if (isAI) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onSelectTab?.(item.name)}
                  className={`ml-2 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? "border border-indigo-400/60 bg-indigo-500/20 text-indigo-200 shadow-sm shadow-indigo-500/20"
                      : "border border-white/[0.08] text-zinc-400 hover:border-white/[0.15] hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onSelectTab?.(item.name)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-white/[0.08] text-white border border-white/[0.08] shadow-sm"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Market Status + Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500">Delayed Market Data</span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.06] bg-zinc-950 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  onSelectTab?.(item.name);
                  setMobileMenuOpen(false);
                }}
                className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                  currentTab === item.name
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
