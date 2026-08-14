import { NextResponse } from "next/server";
import { structureStatementWithOpenAI } from "@/lib/parse/structureWithOpenAI";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Generous ceiling so large row statements can upload; platform may still cap body size. */
const MAX_BYTES = 50 * 1024 * 1024;

function isAllowed(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type === "text/csv" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
}

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

    if (file.size <= 0) {
      return NextResponse.json({ error: "Empty file." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 50MB." },
        { status: 400 },
      );
    }

    if (!isAllowed(file)) {
      return NextResponse.json(
        {
          error: "Please upload a spreadsheet as Excel (.xlsx) or CSV.",
        },
        { status: 400 },
      );
    }

    const result = await structureStatementWithOpenAI(file);

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
