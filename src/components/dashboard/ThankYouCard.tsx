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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs text-white">
              {initials(top.name)}
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
                  Giver · top sender
                </p>
                <div className="cele-pop mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white text-base font-semibold text-black sm:h-16 sm:w-16 sm:text-lg">
                  {initials(top.name)}
                </div>
                <h2 className="cele-rise mt-4 font-[family-name:var(--font-display)] text-xl tracking-tight text-white sm:mt-5 sm:text-3xl">
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

            <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:justify-center">
              <Button
                className="w-full sm:w-auto"
                disabled={downloading}
                onClick={() => void downloadCard()}
              >
                {downloading ? "Preparing…" : "Download & send"}
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={reshuffle}
                disabled={downloading}
              >
                New thank-you line
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
