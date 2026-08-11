"use client";

import {
  previewMetrics,
  previewRecipients,
  previewSenders,
} from "@/components/landing/previewData";

function RankRows({
  rows,
  accent,
  delayBase,
}: {
  rows: { name: string; pct: number; amount: string }[];
  accent: string;
  delayBase: number;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, i) => (
        <div key={row.name} className="flex items-center gap-2.5">
          <span className="w-16 shrink-0 truncate text-[11px] text-zinc-400 sm:w-20 sm:text-xs">
            {row.name}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="landing-bar h-full rounded-full"
              style={{
                width: `${row.pct}%`,
                background: accent,
                animationDelay: `${delayBase + i * 90}ms`,
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[11px] text-zinc-500 sm:text-xs">
            {row.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Static product capture used as the landing hero visual. */
export function DashboardPreview() {
  return (
    <div
      className="landing-dash pointer-events-none relative w-full overflow-hidden rounded-none border-y border-white/10 bg-[#0a0a0c]/95 sm:rounded-2xl sm:border sm:shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <span className="size-2 rounded-full bg-white/25" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/10" />
        <span className="ml-2 font-[family-name:var(--font-display)] text-xs tracking-tight text-zinc-400">
          Overview
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.16em] text-zinc-600">
          Preview
        </span>
      </div>

      <div className="space-y-4 p-3 sm:space-y-5 sm:p-5">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {previewMetrics.map((m, i) => (
            <div
              key={m.label}
              className="landing-fade rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent px-3 py-3"
              style={{ animationDelay: `${120 + i * 70}ms` }}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {m.label}
              </p>
              <p className="mt-1.5 font-[family-name:var(--font-display)] text-base tracking-tight text-white sm:text-lg">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
          <div className="landing-fade rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4" style={{ animationDelay: "420ms" }}>
            <p className="font-[family-name:var(--font-display)] text-sm text-white">
              Top recipients
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Who you give the most</p>
            <div className="mt-3">
              <RankRows
                rows={previewRecipients}
                accent="rgba(255,255,255,0.78)"
                delayBase={520}
              />
            </div>
          </div>

          <div className="landing-fade rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4" style={{ animationDelay: "520ms" }}>
            <p className="font-[family-name:var(--font-display)] text-sm text-white">
              Top senders
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Who sends you the most</p>
            <div className="mt-3">
              <RankRows
                rows={previewSenders}
                accent="rgba(161,161,170,0.85)"
                delayBase={620}
              />
            </div>
          </div>
        </div>

        <div
          className="landing-fade flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 sm:px-4"
          style={{ animationDelay: "700ms" }}
        >
          <div
            className="landing-pie size-14 shrink-0 rounded-full sm:size-16"
            style={{
              background:
                "conic-gradient(#fff 0 39%, #71717a 39% 100%)",
              mask: "radial-gradient(circle 18px, transparent 98%, #000 100%)",
              WebkitMask:
                "radial-gradient(circle 18px, transparent 98%, #000 100%)",
            }}
          />
          <div className="min-w-0 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            <p className="font-[family-name:var(--font-display)] text-sm text-white">
              Person transfer volume
            </p>
            <p className="mt-1">Out · ₦242k · In · ₦385k</p>
            <p className="mt-1 text-zinc-500">
              Ada takes ~22% of sends — open anyone for the full story.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
