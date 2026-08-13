"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PersonDrawer } from "@/components/dashboard/PersonDrawer";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { ParseProgressOverlay } from "@/components/upload/ParseProgressOverlay";
import { useLedger } from "@/hooks/useLedger";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, meta, setSidebarOpen, parseProgress } = useLedger();
  const ready = status === "ready";
  const progressOverlay =
    status === "parsing" && parseProgress ? (
      <ParseProgressOverlay progress={parseProgress} />
    ) : null;

  // Public share links render without the dashboard shell.
  if (pathname?.startsWith("/card")) {
    return (
      <div className="relative min-h-dvh w-full overflow-x-clip bg-[#070708] text-zinc-100">
        <div className="pointer-events-none absolute inset-0 lightning-field" aria-hidden />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Idle / parsing: LandingPage owns the full chrome + progress overlay.
  if (!ready) {
    return <>{children}</>;
  }

  const sourceCount = meta?.fileNames?.length ?? 1;

  return (
    <div className="relative flex min-h-dvh w-full max-w-[100vw] overflow-x-clip bg-[#070708] text-zinc-100">
      {progressOverlay}
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
