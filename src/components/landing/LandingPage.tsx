"use client";

import { useCallback, useId, type ReactNode } from "react";
import { ParseProgressOverlay } from "@/components/upload/ParseProgressOverlay";
import { useToast } from "@/context/ToastContext";
import { useLedger } from "@/hooks/useLedger";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import { isStatementFile } from "@/lib/parse/parseFile";

const ACCEPT =
  ".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

const MEMES = [
  { src: "/money-root-evil.png", alt: "Money makes me happy" },
  { src: "/counting-money.gif", alt: "Counting naira" },
  { src: "/torn-money.jpg", alt: "This your money is torn" },
  { src: "/thinking.jpg", alt: "Thinking about the debit" },
  { src: "/tenor-1.gif", alt: "Side-eye reaction" },
];

function UploadButton({
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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium tracking-wide text-black transition hover:bg-zinc-100 sm:px-7 sm:py-3.5 sm:text-base ${
        busy ? "pointer-events-none cursor-not-allowed opacity-40" : ""
      } ${className}`}
    >
      {children}
    </label>
  );
}

function MemeMarquee({ reverse = false }: { reverse?: boolean }) {
  const track = [...MEMES, ...MEMES, ...MEMES];
  return (
    <div className="meme-marquee" aria-hidden>
      <div
        className={`meme-marquee-track ${reverse ? "meme-marquee-reverse" : ""}`}
      >
        {track.map((meme, i) => (
          <div key={`${meme.src}-${i}`} className="meme-marquee-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={meme.src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const { loadFiles, status, error, parseProgress } = useLedger();
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
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[#070708] text-zinc-100">
      {busy && parseProgress ? (
        <ParseProgressOverlay progress={parseProgress} />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_55%)]" />

      <main className="relative z-10 flex flex-1 flex-col justify-start pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-0">
        <div className="meme-marquee-stack">
          <MemeMarquee />
          <MemeMarquee reverse />
          <div className="sm:hidden">
            <MemeMarquee />
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-8 text-center sm:px-8 sm:pb-14 sm:pt-14 md:pt-16">
          <p className="landing-fade text-[10px] uppercase tracking-[0.3em] text-zinc-500 sm:text-xs">
            Excel · CSV · spreadsheet
          </p>

          <h1 className="landing-fade mt-4 font-[family-name:var(--font-display)] text-6xl leading-[0.92] tracking-[-0.07em] text-white sm:text-8xl md:text-[9rem] lg:text-[11rem]">
            Giver
          </h1>

          <p className="landing-fade mx-auto mt-5 max-w-2xl font-[family-name:var(--font-display)] text-xl leading-[1.15] tracking-tight text-zinc-300 sm:mt-7 sm:text-3xl md:text-4xl lg:text-5xl">
            Who you dey dash pass?
            <br />
            Who dey dash you pass?
          </p>

          <p className="landing-fade mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-500 sm:mt-6 sm:text-base md:text-lg">
            Upload your bank spreadsheet. Make we expose who dey chop your money
            — and who dey feed you. you wan use PDF?{" "}
            <a
              href="https://www.ilovepdf.com/pdf_to_excel"
              target="_blank"
              rel="noopener noreferrer"
              className="italic underline underline-offset-4 decoration-zinc-500 transition hover:text-zinc-300 hover:decoration-zinc-300"
            >
              convert to Excel
            </a>
            .
          </p>

          <div className="landing-fade mt-8 flex flex-col items-center gap-3 sm:mt-10">
            <UploadButton
              htmlFor={inputId}
              busy={busy}
              className="landing-cta-pulse w-full max-w-xs sm:w-auto"
            >
              {busy ? "E dey work…" : "Drop Excel or CSV here"}
            </UploadButton>
            <p className="text-xs text-zinc-600 sm:text-sm">
              .xlsx · .xls · .csv · PDF?{" "}
              <a
                href="https://www.ilovepdf.com/pdf_to_excel"
                target="_blank"
                rel="noopener noreferrer"
                className="italic underline underline-offset-2 decoration-zinc-600 hover:text-zinc-400"
              >
                convert here
              </a>
            </p>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-300">{error}</p>
          ) : null}
        </div>
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
