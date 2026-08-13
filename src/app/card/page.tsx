"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MemeCardFace } from "@/components/dashboard/MemeCardFace";
import { resolveCardMeme } from "@/lib/cardMemes";
import { decodeShareCard } from "@/lib/shareCard";

function SharedCardInner() {
  const params = useSearchParams();
  const token = params.get("d") ?? "";
  const card = useMemo(() => decodeShareCard(token), [token]);

  if (!card) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-3xl text-white">
          Giver
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          This share link is invalid. Ask them to send a fresh card.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex rounded-md border border-white/20 bg-white px-4 py-2.5 text-sm font-medium text-black"
        >
          Open Giver
        </a>
      </div>
    );
  }

  const isThanks = card.k === "thanks";
  const meme = resolveCardMeme(card.m, card.k);
  const eyebrow = isThanks ? "Giver · money received" : "Giver · money don go";
  const foot = isThanks ? "Respect · from Giver" : "Check who you give the most";
  const shareLabel = isThanks ? "of received" : "of sends";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="text-center font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
        Giver
      </p>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        Shared Naija skit
      </p>

      <div className="cele-card mt-8">
        <MemeCardFace
          meme={meme}
          eyebrow={eyebrow}
          headline={card.h}
          reply={card.r}
          shareLabel={shareLabel}
          sharePctFraction={card.p / 100}
          amount={card.a}
          txnCount={card.c}
          foot={foot}
        />
      </div>

      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-md border border-white/20 bg-white px-4 py-2.5 text-sm font-medium text-black"
      >
        Make your own on Giver
      </a>
    </div>
  );
}

export default function SharedCardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-400">
          Loading card…
        </div>
      }
    >
      <SharedCardInner />
    </Suspense>
  );
}
