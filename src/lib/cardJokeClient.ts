import type { CelebrationLines } from "@/lib/celebrationCopy";
import { buildCelebration, buildThankYou } from "@/lib/celebrationCopy";

export type CardJokeKind = "celebration" | "thanks";

function localJoke(
  kind: CardJokeKind,
  name: string,
  sharePct: number,
): CelebrationLines {
  return kind === "celebration"
    ? buildCelebration(name, sharePct)
    : buildThankYou(name, sharePct);
}

/** Ask the server for a Pidgin joke; always falls back to stored jokes if AI fails. */
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
    const data = (await res.json().catch(() => null)) as CelebrationLines | null;
    if (data?.headline && data?.reply) return data;
  } catch {
    /* use stored jokes */
  }
  return localJoke(opts.kind, opts.name, opts.sharePct);
}
