export type CardMemeId =
  | "thinking"
  | "dollar"
  | "counting"
  | "smiling"
  | "tenor"
  | "money-evil"
  | "torn"
  | "counting-money"
  | "give-ten"
  | "enjoyment"
  | "show-money";

export type CardMemeKind = "celebration" | "thanks";

export type CardMeme = {
  id: CardMemeId;
  src: string;
  /** Short skit vibe label shown on the card */
  vibe: string;
};

/** Nigerian funny money / skit memes from /public */
export const CARD_MEMES: Record<CardMemeId, CardMeme> = {
  thinking: {
    id: "thinking",
    src: "/thinking.jpg",
    vibe: "When I check my statement…",
  },
  dollar: {
    id: "dollar",
    src: "/dollar.png",
    vibe: "Na the money wey dey benefit",
  },
  counting: {
    id: "counting",
    src: "/counting.gif",
    vibe: "Counting wetin don leave",
  },
  smiling: {
    id: "smiling",
    src: "/smilling-meme.jpg",
    vibe: "When the blessing land",
  },
  tenor: {
    id: "tenor",
    src: "/tenor-1.gif",
    vibe: "Skit energy only",
  },
  "money-evil": {
    id: "money-evil",
    src: "/money-root-evil.png",
    vibe: "Money make me smile",
  },
  torn: {
    id: "torn",
    src: "/torn-money.jpg",
    vibe: "This your money…",
  },
  "counting-money": {
    id: "counting-money",
    src: "/counting-money.gif",
    vibe: "Count am again",
  },
  "give-ten": {
    id: "give-ten",
    src: "/me-give-you-ten.jpg",
    vibe: "Me give you ten zillion",
  },
  enjoyment: {
    id: "enjoyment",
    src: "/enjoyment.gif",
    vibe: "Soft life loading",
  },
  "show-money": {
    id: "show-money",
    src: "/show-me-the-money.jpg",
    vibe: "Show me the money",
  },
};

const CELEBRATION_IDS: CardMemeId[] = [
  "thinking",
  "torn",
  "dollar",
  "counting",
  "counting-money",
  "show-money",
  "tenor",
];

const THANKS_IDS: CardMemeId[] = [
  "smiling",
  "money-evil",
  "give-ten",
  "enjoyment",
  "tenor",
  "counting-money",
  "show-money",
];

function poolFor(kind: CardMemeKind): CardMemeId[] {
  return kind === "thanks" ? THANKS_IDS : CELEBRATION_IDS;
}

export function pickCardMeme(
  kind: CardMemeKind,
  excludeId?: CardMemeId | null,
): CardMeme {
  const pool = poolFor(kind);
  const options =
    excludeId && pool.length > 1
      ? pool.filter((id) => id !== excludeId)
      : pool;
  const id = options[Math.floor(Math.random() * options.length)]!;
  return CARD_MEMES[id];
}

export function resolveCardMeme(
  id: string | null | undefined,
  kind: CardMemeKind,
): CardMeme {
  if (id && id in CARD_MEMES) return CARD_MEMES[id as CardMemeId];
  return CARD_MEMES[poolFor(kind)[0]!];
}

export function isCardMemeId(value: unknown): value is CardMemeId {
  return typeof value === "string" && value in CARD_MEMES;
}
