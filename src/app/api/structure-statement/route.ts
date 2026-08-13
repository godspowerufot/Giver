import { NextResponse } from "next/server";
import { structureStatementWithGemini } from "@/lib/parse/structureWithGemini";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing statement file." },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 20MB." },
        { status: 400 },
      );
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json(
        { error: "Please upload a CSV bank or wallet statement." },
        { status: 400 },
      );
    }

    const result = await structureStatementWithGemini(file);

    return NextResponse.json({
      transactions: result.transactions.map((tx) => ({
        ...tx,
        date: tx.date ? tx.date.toISOString() : null,
      })),
      meta: result.meta,
    });
  } catch (err) {
    console.error("[structure-statement]", err);
    const message =
      err instanceof Error ? err.message : "Failed to structure statement.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
