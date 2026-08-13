"use client";

import type { CSSProperties } from "react";
import { formatNaira, formatPercent } from "@/lib/format";
import type { CardMeme } from "@/lib/cardMemes";

type MemeCardFaceProps = {
  meme: CardMeme;
  eyebrow: string;
  headline: string | null;
  reply: string | null;
  loadingLabel?: string;
  shareLabel: string;
  sharePctFraction: number;
  amount: number;
  txnCount: number;
  foot: string;
  burstKey?: number;
};

export function MemeCardFace({
  meme,
  eyebrow,
  headline,
  reply,
  loadingLabel = "Cooking fresh Pidgin joke…",
  shareLabel,
  sharePctFraction,
  amount,
  txnCount,
  foot,
  burstKey = 0,
}: MemeCardFaceProps) {
  return (
    <div
      key={burstKey}
      className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#0c0c0e]"
    >
      <div className="cele-sparks pointer-events-none absolute inset-0 z-20" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="cele-spark"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>

      <div className="cele-pop relative aspect-[4/3] w-full overflow-hidden bg-black sm:aspect-[16/11]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meme.src}
          alt=""
          className="h-full w-full object-cover object-center"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-black/25" />
        <p className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-200 backdrop-blur-sm">
          Naija skit
        </p>
        <p className="absolute bottom-3 left-3 right-3 text-left text-xs font-medium text-white/90 drop-shadow sm:text-sm">
          {meme.vibe}
        </p>
      </div>

      <div className="relative px-5 pb-7 pt-5 text-center sm:px-6 sm:pb-8 sm:pt-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          {eyebrow}
        </p>

        {headline && reply ? (
          <>
            <h2 className="cele-rise mt-3 font-[family-name:var(--font-display)] text-xl tracking-tight text-white sm:mt-4 sm:text-3xl">
              {headline}
            </h2>
            <p className="cele-rise mt-3 text-sm leading-relaxed text-zinc-300 [animation-delay:120ms] sm:mt-4">
              “{reply}”
            </p>
          </>
        ) : (
          <p className="mt-6 animate-pulse text-sm text-zinc-400">{loadingLabel}</p>
        )}

        <div className="cele-rise mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 [animation-delay:200ms] sm:mt-6 sm:gap-6">
          <span>
            {formatPercent(sharePctFraction)} {shareLabel}
          </span>
          <span>{formatNaira(amount)}</span>
          <span>{txnCount} txns</span>
        </div>
        <p className="cele-rise mt-6 text-[10px] uppercase tracking-[0.18em] text-zinc-600 [animation-delay:260ms] sm:mt-8">
          {foot}
        </p>
      </div>
    </div>
  );
}
