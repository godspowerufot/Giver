"use client";

import type { ParseProgress } from "@/lib/types";

const STAGE_HINT: Record<ParseProgress["stage"], string> = {
  reading: "Opening your statement",
  checking: "Detecting bank layout",
  structuring: "Normalizing rows",
  ranking: "Building your rankings",
  done: "Ready",
};

export function ParseProgressOverlay({ progress }: { progress: ParseProgress }) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#070708]/92 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white">
              {pct}%
            </p>
          </div>
        </div>

        <p className="mt-6 font-[family-name:var(--font-display)] text-xl tracking-tight text-white">
          {progress.label}
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          {STAGE_HINT[progress.stage]}
          {progress.detail ? ` · ${progress.detail}` : ""}
        </p>

        <div className="mx-auto mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-4 animate-pulse text-xs uppercase tracking-[0.2em] text-zinc-500">
          Please wait
        </p>
      </div>
    </div>
  );
}
