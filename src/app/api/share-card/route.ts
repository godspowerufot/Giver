import { NextResponse } from "next/server";
import {
  encodeShareCard,
  shareCardPath,
  type ShareCardPayload,
} from "@/lib/shareCard";

export const runtime = "nodejs";

async function shortenWithIsGd(longUrl: string): Promise<string | null> {
  try {
    const endpoint = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { shorturl?: string; errormessage?: string };
    return data.shorturl?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ShareCardPayload>;
    if (
      (body.k !== "celebration" && body.k !== "thanks") ||
      !body.n ||
      !body.h ||
      !body.r
    ) {
      return NextResponse.json({ error: "Invalid card." }, { status: 400 });
    }

    const payload: ShareCardPayload = {
      k: body.k,
      n: String(body.n).slice(0, 80),
      h: String(body.h).slice(0, 120),
      r: String(body.r).slice(0, 400),
      p: Math.round((Number(body.p) || 0) * 10) / 10,
      a: Math.round(Number(body.a) || 0),
      c: Math.round(Number(body.c) || 0),
    };

    const origin = new URL(request.url).origin;
    const longUrl = `${origin}${shareCardPath(encodeShareCard(payload))}`;
    const shortUrl = await shortenWithIsGd(longUrl);

    return NextResponse.json({
      url: shortUrl || longUrl,
      longUrl,
      shortened: Boolean(shortUrl),
    });
  } catch (err) {
    console.error("[share-card]", err);
    return NextResponse.json(
      { error: "Could not create share link." },
      { status: 500 },
    );
  }
}
