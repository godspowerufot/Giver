import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  buildCelebration,
  buildThankYou,
  type CelebrationLines,
} from "@/lib/celebrationCopy";

export const runtime = "nodejs";
export const maxDuration = 30;

type Kind = "celebration" | "thanks";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

function fallback(kind: Kind, name: string, sharePct: number): CelebrationLines {
  return kind === "celebration"
    ? buildCelebration(name, sharePct)
    : buildThankYou(name, sharePct);
}

export async function POST(request: Request) {
  let kind: Kind = "celebration";
  let name = "Friend";
  let sharePct = 0;

  try {
    const body = (await request.json()) as {
      kind?: Kind;
      name?: string;
      sharePct?: number;
    };

    kind = body.kind === "thanks" ? "thanks" : "celebration";
    name = String(body.name ?? "").trim().slice(0, 80) || "Friend";
    sharePct = Number(body.sharePct) || 0;

    if (!String(body.name ?? "").trim()) {
      return NextResponse.json({ error: "Missing name." }, { status: 400 });
    }

    const client = getClient();
    if (!client) {
      return NextResponse.json(fallback(kind, name, sharePct));
    }

    const short = name.split(/\s+/)[0] ?? name;
    const system =
      kind === "celebration"
        ? `You write savage Nigerian Pidgin jokes for a money app called Giver.
The spender is roasting/celebrating their #1 recipient (person who collects their money most).
Return ONLY JSON: {"headline":"...","reply":"..."}.
Rules: funny, savage but not abusive/hate; Pidgin Nigerian vibe; headline short (max 8 words, include first name "${short}"); reply 1-2 sentences max 220 chars; no markdown; fresh random joke each time.`
        : `You write funny Nigerian Pidgin thank-you jokes for a money app called Giver.
The receiver is thanking their #1 sender (person who sends them money most).
Return ONLY JSON: {"headline":"...","reply":"..."}.
Rules: funny, warm + a little savage/playful; Pidgin Nigerian vibe; headline short (max 8 words, include first name "${short}"); reply 1-2 sentences max 220 chars; no markdown; fresh random joke each time.`;

    const user =
      kind === "celebration"
        ? `Name: ${name}. They got about ${sharePct.toFixed(0)}% of this person's transfers. Invent a brand-new Pidgin roast celebration.`
        : `Name: ${name}. They sent about ${sharePct.toFixed(0)}% of money this person received. Invent a brand-new Pidgin thank-you joke.`;

    try {
      const response = await client.chat.completions.create({
        model: getModel(),
        temperature: 1.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";
      const parsed = JSON.parse(raw) as { headline?: string; reply?: string };
      const headline = String(parsed.headline ?? "").trim();
      const reply = String(parsed.reply ?? "").trim();

      if (!headline || !reply) {
        return NextResponse.json(fallback(kind, name, sharePct));
      }

      return NextResponse.json({
        headline: headline.slice(0, 120),
        reply: reply.slice(0, 400),
      } satisfies CelebrationLines);
    } catch (aiErr) {
      // No credits / rate limit / model errors → always use stored Pidgin jokes.
      console.warn(
        "[card-joke] OpenAI failed; using stored jokes",
        aiErr instanceof Error ? aiErr.message : aiErr,
      );
      return NextResponse.json(fallback(kind, name, sharePct));
    }
  } catch (err) {
    console.error("[card-joke]", err);
    return NextResponse.json(fallback(kind, name, sharePct));
  }
}
