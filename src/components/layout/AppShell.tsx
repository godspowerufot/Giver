"use client";

import type { ReactNode } from "react";
import { PersonDrawer } from "@/components/dashboard/PersonDrawer";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { useLedger } from "@/hooks/useLedger";

export function AppShell({ children }: { children: ReactNode }) {
  const { status, meta, setSidebarOpen } = useLedger();
  const ready = status === "ready";

  if (!ready) {
    return (
      <div className="relative min-h-dvh w-full max-w-[100vw] overflow-x-clip bg-[#070708] text-zinc-100">
        <div className="pointer-events-none absolute inset-0 z-0 lightning-field" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[320px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)] sm:h-[420px]"
          aria-hidden
        />
        <header className="relative z-20 border-b border-white/10 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-5 sm:px-8 sm:py-6">
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em] text-white sm:text-4xl">
                Giver
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
                Check who you give the most
              </p>
            </div>
          </div>
        </header>
        <main className="relative z-20 mx-auto w-full max-w-3xl min-w-0 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    );
  }

  const sourceCount = meta?.fileNames?.length ?? 1;

  return (
    <div className="relative flex min-h-dvh w-full max-w-[100vw] overflow-x-clip bg-[#070708] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 lightning-field" aria-hidden />
      <Sidebar />

      <div className="relative z-10 flex min-h-dvh min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
        <header className="sticky top-0 z-20 flex w-full min-w-0 items-center justify-between gap-3 border-b border-white/10 bg-[#070708]/90 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-200 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs text-zinc-300 sm:text-sm">
                {meta?.fileName ?? "Statement loaded"}
              </p>
              <p className="truncate text-[11px] text-zinc-600 sm:text-xs">
                {sourceCount > 1
                  ? `${sourceCount} statements merged`
                  : (meta?.period ?? "See who gets the most from you")}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <FileDropzone mode="append" compact />
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-clip px-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>

      <PersonDrawer />
    </div>
  );
}
