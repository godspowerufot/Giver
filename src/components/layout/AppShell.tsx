"use client";

import type { ReactNode } from "react";
import { PersonDrawer } from "@/components/dashboard/PersonDrawer";
import { Sidebar } from "@/components/layout/Sidebar";
import { useLedger } from "@/hooks/useLedger";

export function AppShell({ children }: { children: ReactNode }) {
  const { status, meta, setSidebarOpen } = useLedger();
  const ready = status === "ready";

  if (!ready) {
    return (
      <div className="relative min-h-dvh overflow-x-clip bg-[#070708] text-zinc-100">
        <div className="pointer-events-none absolute inset-0 lightning-field" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)] sm:h-[420px]" />
        <header className="relative z-10 border-b border-white/10 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-5 sm:px-8 sm:py-6">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em] text-white sm:text-4xl">
                Giver
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
                Check who you give the most
              </p>
            </div>
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh bg-[#070708] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 lightning-field" />
      <Sidebar />

      <div className="relative z-10 flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#070708]/90 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-200 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-zinc-300 sm:text-sm">
                {meta?.fileName ?? "Statement loaded"}
              </p>
              <p className="truncate text-[11px] text-zinc-600 sm:text-xs">
                {meta?.period ?? "See who gets the most from you"}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>

      <PersonDrawer />
    </div>
  );
}
