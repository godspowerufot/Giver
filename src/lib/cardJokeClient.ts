import type { CelebrationLines } from "@/lib/celebrationCopy";
import { buildCelebration, buildThankYou } from "@/lib/celebrationCopy";

export type CardJokeKind = "celebration" | "thanks";

/** Ask the server for a fresh Pidgin joke; falls back locally if the API fails. */
export async function fetchCardJoke(opts: {
  kind: CardJokeKind;
  name: string;
  sharePct: number;
}): Promise<CelebrationLines> {
  try {
    const res = await fetch("/api/card-joke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) throw new Error("joke api failed");
    const data = (await res.json()) as CelebrationLines;
    if (!data?.headline || !data?.reply) throw new Error("empty joke");
    return data;
  } catch {
    return opts.kind === "celebration"
      ? buildCelebration(opts.name, opts.sharePct)
      : buildThankYou(opts.name, opts.sharePct);
  }
}
