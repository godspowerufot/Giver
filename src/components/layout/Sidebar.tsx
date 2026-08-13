"use client";

import type { DashboardView } from "@/context/LedgerContext";
import { useLedger } from "@/hooks/useLedger";

const NAV: { id: DashboardView; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Metrics & charts" },
  { id: "people", label: "People", hint: "All counterparties" },
  { id: "transactions", label: "Transactions", hint: "Transfer history" },
  { id: "insights", label: "Insights", hint: "Spend suggestions" },
];

export function Sidebar() {
  const { view, setView, meta, reset, sidebarOpen, setSidebarOpen } = useLedger();

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="hidden w-[260px] shrink-0 lg:block" aria-hidden />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(280px,88vw)] flex-col border-r border-white/10 bg-[#0a0a0c] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform duration-200 lg:w-[260px] ${
          sidebarOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-full max-lg:invisible lg:pointer-events-auto lg:visible lg:translate-x-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-5 sm:py-6">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em] text-white">
              Giver
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Who you give most
            </p>
            {meta?.accountName ? (
              <p className="mt-3 truncate text-xs text-zinc-400">{meta.accountName}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-zinc-300 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex w-full flex-col rounded-lg px-3 py-3 text-left transition sm:py-2.5 ${
                  active
                    ? "bg-white text-black"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
                <span
                  className={`text-[11px] ${active ? "text-black/60" : "text-zinc-600"}`}
                >
                  {item.hint}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-md border border-white/15 px-3 py-2.5 text-sm text-zinc-300 transition hover:border-white/35 hover:text-white"
          >
            New file
          </button>
        </div>
      </aside>
    </>
  );
}
