"use client";

import { toPng } from "html-to-image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useLedger } from "@/hooks/useLedger";
import { buildThankYou, type CelebrationLines } from "@/lib/celebrationCopy";
import { formatNaira, formatPercent, initials } from "@/lib/format";

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a9 9 0 1 1-2.6-6.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 4v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThankYouCard() {
  const { insight } = useLedger();
  const top = insight?.topSenders[0];
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CelebrationLines | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const sharePct = useMemo(() => (top ? top.shareOfReceived * 100 : 0), [top]);

  const generate = useCallback(() => {
    if (!top) return;
    setLines(buildThankYou(top.name, sharePct));
    setBurstKey((k) => k + 1);
    setOpen(true);
  }, [top, sharePct]);

  const reshuffle = useCallback(() => {
    if (!top) return;
    setLines(buildThankYou(top.name, sharePct));
    setBurstKey((k) => k + 1);
  }, [top, sharePct]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current || !top) return;
    setDownloading(true);
    try {
      await new Promise((r) => window.setTimeout(r, 450));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0c0c0e",
      });
      const link = document.createElement("a");
      const safe = top.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      link.download = `giver-thank-you-${safe || "card"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download thank-you card", err);
    } finally {
      setDownloading(false);
    }
  }, [top]);

  if (!top) return null;

  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Thank-you card"
          subtitle="For the person who sends you the most — download and send thanks"
        />
        <div className="relative px-5 py-5">
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wallet-money-added.svg"
                alt=""
                className="h-10 w-10 object-contain"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-display)] text-lg text-white">
                {top.name}
              </p>
              <p className="text-xs text-zinc-500">
                {formatPercent(top.shareOfReceived)} · {formatNaira(top.received)} received
              </p>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={generate}>
            Generate thank-you card
          </Button>
        </div>
      </Panel>

      {open && lines ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close thank-you card"
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          <div className="cele-card relative z-10 my-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={reshuffle}
                disabled={downloading}
                aria-label="New random line"
                title="New random line"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0c0c0e] text-zinc-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <RefreshIcon />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0c0c0e] text-zinc-300 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>

            <div
              ref={cardRef}
              key={burstKey}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#0c0c0e]"
            >
              <div className="cele-sparks pointer-events-none absolute inset-0" aria-hidden>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="cele-spark"
                    style={{ "--i": i } as CSSProperties}
                  />
                ))}
              </div>

              <div className="relative px-5 pb-7 pt-6 text-center sm:px-6 sm:pb-8 sm:pt-7">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Giver · money received
                </p>

                <div className="cele-pop relative mx-auto mt-4 flex h-40 w-full max-w-[220px] items-end justify-center sm:mt-5 sm:h-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/wallet-money-added.svg"
                    alt=""
                    className="h-full w-auto max-w-full object-contain"
                    draggable={false}
                  />
                  <div className="absolute -bottom-1 right-[18%] flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:h-11 sm:w-11 sm:text-sm">
                    {initials(top.name)}
                  </div>
                </div>

                <h2 className="cele-rise mt-6 font-[family-name:var(--font-display)] text-xl tracking-tight text-white sm:mt-7 sm:text-3xl">
                  {lines.headline}
                </h2>
                <p className="cele-rise mt-3 text-sm leading-relaxed text-zinc-300 [animation-delay:120ms] sm:mt-4">
                  “{lines.reply}”
                </p>
                <div className="cele-rise mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 [animation-delay:200ms] sm:mt-6 sm:gap-6">
                  <span>{formatPercent(top.shareOfReceived)} of received</span>
                  <span>{formatNaira(top.received)}</span>
                  <span>{top.receivedCount} txns</span>
                </div>
                <p className="cele-rise mt-6 text-[10px] uppercase tracking-[0.18em] text-zinc-600 [animation-delay:260ms] sm:mt-8">
                  With thanks · from Giver
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-4">
              <Button
                className="w-full"
                disabled={downloading}
                onClick={() => void downloadCard()}
              >
                {downloading ? "Preparing…" : "Download & send"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
