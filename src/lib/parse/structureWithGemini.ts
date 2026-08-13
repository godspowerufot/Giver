import {
  STRUCTURE_PROMPT,
  parseAiStatementText,
} from "@/lib/parse/normalizeAiStatement";
import { dedupeTransactions } from "@/lib/parse/mergeStatements";
import type { ParseResult } from "@/lib/parse/parseFile";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Keep each Gemini CSV chunk small enough for Flash free tier. */
const CSV_CHUNK_ROWS = 120;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "AI structuring is not configured. Add GEMINI_API_KEY to .env.local.",
    );
  }
  return key;
}

function mimeForFile(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return "application/pdf";
  }
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return "text/csv";
  }
  if (name.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (name.endsWith(".xls")) {
    return "application/vnd.ms-excel";
  }
  return file.type || "application/octet-stream";
}

function extractText(payload: unknown): string {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason;
    throw new Error(
      reason
        ? `Gemini returned an empty response (${reason}).`
        : "Gemini returned an empty response.",
    );
  }
  return text;
}

async function generateStructuredJson(
  apiKey: string,
  model: string,
  mimeType: string,
  base64: string,
  fileName: string,
  extraNote = "",
): Promise<string> {
  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
            {
              text: `${STRUCTURE_PROMPT}

File name: ${fileName}
${extraNote}

Bank exports differ a lot. Map ANY column layout into the JSON shape above.
Examples of aliases: recipient/payee/beneficiary → counterparty; type/flow → direction;
transaction_id/ref → reference; narration/details → description.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      (json as { error?: { message?: string } })?.error?.message ||
      JSON.stringify(json).slice(0, 220);
    throw new Error(`Gemini structuring failed (${res.status}). ${detail}`);
  }

  return extractText(json);
}

function splitCsvChunks(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [text];

  const header = lines[0];
  const rows = lines.slice(1);
  if (rows.length <= CSV_CHUNK_ROWS) {
    return [text];
  }

  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += CSV_CHUNK_ROWS) {
    const slice = rows.slice(i, i + CSV_CHUNK_ROWS);
    chunks.push([header, ...slice].join("\n"));
  }
  return chunks;
}

async function structureCsvText(
  fileName: string,
  text: string,
): Promise<ParseResult> {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
  const chunks = splitCsvChunks(text);

  console.info(
    `[giver] Gemini CSV ${fileName}: ${chunks.length} chunk(s)`,
  );

  const parts: ParseResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const base64 = Buffer.from(chunks[i], "utf8").toString("base64");
    const raw = await generateStructuredJson(
      apiKey,
      model,
      "text/csv",
      base64,
      fileName,
      chunks.length > 1
        ? `This is chunk ${i + 1} of ${chunks.length}. Extract every row in this chunk.`
        : "",
    );
    parts.push(parseAiStatementText(raw, fileName));
  }

  const transactions = dedupeTransactions(
    parts.flatMap((p) => p.transactions),
  );
  const first = parts[0]?.meta;

  return {
    transactions,
    meta: {
      accountName: first?.accountName,
      accountNumber: first?.accountNumber,
      period: first?.period,
      fileName,
      detectedMode: "ai_structured",
    },
  };
}

export async function structureStatementWithGemini(
  file: File,
): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type === "text/csv";

  if (isCsv) {
    const text = await file.text();
    return structureCsvText(file.name, text);
  }

  const apiKey = getApiKey();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const raw = await generateStructuredJson(
    apiKey,
    model,
    mimeForFile(file),
    base64,
    file.name,
  );
  return parseAiStatementText(raw, file.name);
}
