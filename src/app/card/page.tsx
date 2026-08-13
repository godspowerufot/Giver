"use client";

import { Suspense, useMemo, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { formatNaira, formatPercent, initials } from "@/lib/format";
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
          This share link is invalid or expired. Ask them to send a fresh card.
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
  const art = isThanks ? "/wallet-money-added.svg" : "/txconfirmation.svg";
  const eyebrow = isThanks ? "Giver · money received" : "Giver · money don go";
  const foot = isThanks ? "Respect · from Giver" : "Check who you give the most";
  const shareLabel = isThanks ? "of received" : "of sends";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="text-center font-[family-name:var(--font-display)] text-2xl tracking-tight text-white">
        Giver
      </p>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        Shared card
      </p>

      <div className="cele-card relative mt-8 overflow-hidden rounded-2xl border border-white/20 bg-[#0c0c0e]">
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
            {eyebrow}
          </p>

          <div className="cele-pop relative mx-auto mt-4 flex h-40 w-full max-w-[220px] items-end justify-center sm:mt-5 sm:h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={art}
              alt=""
              className="h-full w-auto max-w-full object-contain"
              draggable={false}
            />
            <div className="absolute -bottom-1 right-[18%] flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white text-xs font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:h-11 sm:w-11 sm:text-sm">
              {initials(card.n)}
            </div>
          </div>

          <h1 className="cele-rise mt-6 font-[family-name:var(--font-display)] text-xl tracking-tight text-white sm:mt-7 sm:text-3xl">
            {card.h}
          </h1>
          <p className="cele-rise mt-3 text-sm leading-relaxed text-zinc-300 [animation-delay:120ms] sm:mt-4">
            “{card.r}”
          </p>
          <div className="cele-rise mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 [animation-delay:200ms] sm:mt-6 sm:gap-6">
            <span>
              {formatPercent(card.p / 100)} {shareLabel}
            </span>
            <span>{formatNaira(card.a)}</span>
            <span>{card.c} txns</span>
          </div>
          <p className="cele-rise mt-6 text-[10px] uppercase tracking-[0.18em] text-zinc-600 [animation-delay:260ms] sm:mt-8">
            {foot}
          </p>
        </div>
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
