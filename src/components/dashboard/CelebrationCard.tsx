"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CardShareIcons } from "@/components/dashboard/CardShareIcons";
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
import type { ShareCardPayload } from "@/lib/shareCard";

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

export function CelebrationCard() {
  const { insight } = useLedger();
  const { toast } = useToast();
  const {
    share,
    shareWhatsApp,
    shareGmail,
    shareX,
    shareInstagram,
    busy: sharing,
    copied,
  } = useShareCardLink();
  const top = insight?.topRecipients[0];
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CelebrationLines | null>(null);
  const [meme, setMeme] = useState<CardMeme>(() => pickCardMeme("celebration"));
  const [burstKey, setBurstKey] = useState(0);
  const [loadingJoke, setLoadingJoke] = useState(false);

  const sharePct = useMemo(() => (top ? top.shareOfSent * 100 : 0), [top]);

  const payload = useCallback((): ShareCardPayload | null => {
    if (!top || !lines) return null;
    return {
      k: "celebration",
      n: top.name,
      h: lines.headline,
      r: lines.reply,
      p: sharePct,
      a: top.sent,
      c: top.sentCount,
      m: meme.id,
    };
  }, [top, lines, sharePct, meme.id]);

  const loadJoke = useCallback(async () => {
    if (!top) return;
    setLoadingJoke(true);
    try {
      setMeme((prev) => pickCardMeme("celebration", prev.id));
      const next = await fetchCardJoke({
        kind: "celebration",
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
    const data = payload();
    if (!data) return;
    const result = await share(data);
    if (result.copied) {
      toast("Link copied — send it so they can open the card", "info");
    }
  }, [payload, share, toast]);

  const runShare = useCallback(
    async (fn: (p: ShareCardPayload) => Promise<unknown>, note?: string) => {
      const data = payload();
      if (!data) return;
      await fn(data);
      if (note) toast(note, "info");
    },
    [payload, toast],
  );

  if (!top) return null;

  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Celebration card"
          subtitle="Naija skit meme + Pidgin roast — share the link"
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
                {formatPercent(top.shareOfSent)} · {formatNaira(top.sent)} sent
              </p>
            </div>
          </div>
          <Button
            className="mt-5 w-full"
            disabled={loadingJoke}
            onClick={() => void generate()}
          >
            {loadingJoke ? "Cooking skit…" : "Generate celebration card"}
          </Button>
        </div>
      </Panel>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close celebration"
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
              eyebrow="Giver · money don go"
              headline={lines?.headline ?? null}
              reply={lines?.reply ?? null}
              loadingLabel="Cooking fresh Pidgin skit…"
              shareLabel="of sends"
              sharePctFraction={top.shareOfSent}
              amount={top.sent}
              txnCount={top.sentCount}
              foot="Check who you give the most"
              shareIcons={
                <CardShareIcons
                  disabled={!lines || sharing || loadingJoke}
                  onWhatsApp={() => void runShare(shareWhatsApp)}
                  onGmail={() => void runShare(shareGmail)}
                  onInstagram={() =>
                    void runShare(
                      shareInstagram,
                      "Link copied — paste am on Instagram",
                    )
                  }
                  onX={() => void runShare(shareX)}
                />
              }
            />

            <div className="mt-3 sm:mt-4">
              <Button
                className="w-full"
                disabled={!lines || sharing || loadingJoke}
                onClick={() => void shareCard()}
              >
                {sharing
                  ? "Opening…"
                  : copied
                    ? "Link copied"
                    : "Copy / share link"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-zinc-500">
                Or use the icons on the card — WhatsApp, Gmail, Instagram, X
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
