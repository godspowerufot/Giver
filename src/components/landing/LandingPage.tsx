"use client";

import { useCallback, useId, type ReactNode } from "react";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { useToast } from "@/context/ToastContext";
import { useLedger } from "@/hooks/useLedger";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import { isStatementFile } from "@/lib/parse/parseFile";

const ACCEPT = ".csv,text/csv";

function UploadLabel({
  htmlFor,
  busy,
  className = "",
  children,
}: {
  htmlFor: string;
  busy: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-4 py-2.5 text-sm font-medium tracking-wide text-black shadow-[0_0_24px_rgba(255,255,255,0.18)] transition duration-200 ${
        busy ? "pointer-events-none cursor-not-allowed opacity-40" : ""
      } ${className}`}
    >
      {children}
    </label>
  );
}

export function LandingPage() {
  const { loadFiles, status, error } = useLedger();
  const { toast } = useToast();
  const inputId = useId();
  const busy = status === "parsing";

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const list = files ? [...files] : [];
      if (!list.length) return;
      if (list.some((file) => !isStatementFile(file))) {
        toast(SPREADSHEET_TOAST, "error");
        return;
      }
      await loadFiles(list, "replace");
    },
    [loadFiles, toast],
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#070708] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 z-0 lightning-field" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[55vh] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14),transparent_58%)]"
        aria-hidden
      />

      <header className="relative z-20 border-b border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-5 sm:px-8 sm:py-6">
          <div className="landing-fade" style={{ animationDelay: "40ms" }}>
            <p className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
              Giver
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
              Check who you give the most
            </p>
          </div>
          <div
            className="landing-fade relative z-20 hidden sm:block"
            style={{ animationDelay: "120ms" }}
          >
            <UploadLabel htmlFor={inputId} busy={busy} className="landing-cta-pulse">
              {busy ? "Parsing…" : "Upload CSV"}
            </UploadLabel>
          </div>
        </div>
      </header>

      <main className="relative z-20">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-6 pt-8 sm:gap-10 sm:px-8 sm:pb-10 sm:pt-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.2fr)] lg:items-end lg:gap-12 lg:pt-12">
          <div
            className="landing-fade relative z-20 max-w-xl"
            style={{ animationDelay: "160ms" }}
          >
            <h1 className="font-[family-name:var(--font-display)] text-3xl leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.75rem]">
              Your statement.
              <br />
              Ranked in seconds.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
              Upload one or more CSV statements. Known layouts parse on-device;
              unknown bank formats are structured with Gemini Flash.
            </p>
            <div className="relative z-20 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <UploadLabel
                htmlFor={inputId}
                busy={busy}
                className="w-full landing-cta-pulse sm:w-auto"
              >
                {busy ? "Parsing…" : "Choose CSV"}
              </UploadLabel>
              <p className="text-center text-xs text-zinc-500 sm:text-left">
                CSV only · multi-select supported
              </p>
            </div>
            {error ? (
              <p className="mt-4 text-sm text-red-300">{error}</p>
            ) : null}
          </div>

          <div
            className="landing-fade-up pointer-events-none relative z-0 lg:translate-y-2"
            style={{ animationDelay: "280ms" }}
            aria-hidden
          >
            <div className="pointer-events-none absolute -inset-6 hidden bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_65%)] lg:block" />
            <DashboardPreview />
          </div>
        </section>

        <section className="relative border-t border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-8 sm:py-16 md:flex-row md:items-start md:justify-between md:gap-16">
            {[
              {
                step: "01",
                title: "Upload CSV",
                body: "Export CSV from your bank or wallet — one file or several months.",
              },
              {
                step: "02",
                title: "Rank",
                body: "Top recipients, senders, nets, and spend concentration — clearly.",
              },
              {
                step: "03",
                title: "Share the moment",
                body: "Download a celebration or thank-you card for the people who matter.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="landing-fade max-w-xs"
                style={{ animationDelay: `${400 + i * 100}ms` }}
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-600">
                  {item.step}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-tight text-white">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="relative border-t border-white/10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="font-[family-name:var(--font-display)] text-sm text-zinc-400">
              Giver
            </p>
            <p className="max-w-md text-xs leading-relaxed text-zinc-600">
              Known CSVs stay in your browser. Unfamiliar layouts are structured
              briefly with Gemini, then discarded.
            </p>
          </div>
        </footer>
      </main>

      <input
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
