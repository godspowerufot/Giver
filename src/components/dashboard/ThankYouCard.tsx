"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemeCardFace } from "@/components/dashboard/MemeCardFace";
import { Button } from "@/components/ui/Button";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useToast } from "@/context/ToastContext";
import { useLedger } from "@/hooks/useLedger";
import { useShareCardLink } from "@/hooks/useShareCardLink";
import { fetchCardJoke } from "@/lib/cardJokeClient";
import type { CelebrationLines } from "@/lib/celebrationCopy";
import { pickCardMeme, type CardMeme } from "@/lib/cardMemes";
import { formatNaira, formatPercent } from "@/lib/format";

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
  const { toast } = useToast();
  const { share, busy: sharing, copied } = useShareCardLink();
  const top = insight?.topSenders[0];
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CelebrationLines | null>(null);
  const [meme, setMeme] = useState<CardMeme>(() => pickCardMeme("thanks"));
  const [burstKey, setBurstKey] = useState(0);
  const [loadingJoke, setLoadingJoke] = useState(false);

  const sharePct = useMemo(() => (top ? top.shareOfReceived * 100 : 0), [top]);

  const loadJoke = useCallback(async () => {
    if (!top) return;
    setLoadingJoke(true);
    try {
      setMeme((prev) => pickCardMeme("thanks", prev.id));
      const next = await fetchCardJoke({
        kind: "thanks",
        name: top.name,
        sharePct,
      });
      setLines(next);
      setBurstKey((k) => k + 1);
    } finally {
      setLoadingJoke(false);
    }
  }, [top, sharePct]);

  const generate = useCallback(async () => {
    if (!top) return;
    setOpen(true);
    setLines(null);
    await loadJoke();
  }, [top, loadJoke]);

  const reshuffle = useCallback(async () => {
    await loadJoke();
  }, [loadJoke]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const shareCard = useCallback(async () => {
    if (!top || !lines) return;
    const result = await share({
      k: "thanks",
      n: top.name,
      h: lines.headline,
      r: lines.reply,
      p: sharePct,
      a: top.received,
      c: top.receivedCount,
      m: meme.id,
    });
    if (result.copied) {
      toast("Link copied — send it so they can open the card", "info");
    }
  }, [top, lines, share, sharePct, toast, meme.id]);

  if (!top) return null;

  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Thank-you card"
          subtitle="Naija skit meme + Pidgin thank-you — share the link"
        />
        <div className="relative px-5 py-5">
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meme.src}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-display)] text-lg text-white">
                {top.name}
              </p>
              <p className="text-xs text-zinc-500">
                {formatPercent(top.shareOfReceived)} · {formatNaira(top.received)}{" "}
                received
              </p>
            </div>
          </div>
          <Button
            className="mt-5 w-full"
            disabled={loadingJoke}
            onClick={() => void generate()}
          >
            {loadingJoke ? "Cooking skit…" : "Generate thank-you card"}
          </Button>
        </div>
      </Panel>

      {open ? (
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
                onClick={() => void reshuffle()}
                disabled={loadingJoke || sharing}
                aria-label="New meme and joke"
                title="New meme and joke"
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

            <MemeCardFace
              meme={meme}
              burstKey={burstKey}
              eyebrow="Giver · money received"
              headline={lines?.headline ?? null}
              reply={lines?.reply ?? null}
              loadingLabel="Cooking fresh Pidgin thank-you…"
              shareLabel="of received"
              sharePctFraction={top.shareOfReceived}
              amount={top.received}
              txnCount={top.receivedCount}
              foot="Respect · from Giver"
            />

            <div className="mt-3 sm:mt-4">
              <Button
                className="w-full"
                disabled={!lines || sharing || loadingJoke}
                onClick={() => void shareCard()}
              >
                {sharing
                  ? "Opening share…"
                  : copied
                    ? "Link copied"
                    : "Share card link"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-zinc-500">
                They open the meme skit on Giver — no download
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
