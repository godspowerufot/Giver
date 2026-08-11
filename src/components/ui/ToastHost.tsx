"use client";

import { useToast } from "@/context/ToastContext";

export function ToastHost() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:items-end sm:px-0 sm:pb-0 sm:pt-[max(1rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto toast-in flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md sm:w-[360px] ${
            t.tone === "error"
              ? "border-white/15 bg-[#141416]/95 text-zinc-100"
              : "border-white/15 bg-[#141416]/95 text-zinc-100"
          }`}
          role="status"
        >
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              t.tone === "error"
                ? "bg-white text-black"
                : "bg-white/15 text-white"
            }`}
            aria-hidden
          >
            !
          </span>
          <p className="min-w-0 flex-1 text-sm leading-snug text-zinc-200">
            {t.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            aria-label="Dismiss"
          >
            Close
          </button>
        </div>
      ))}
    </div>
  );
}
