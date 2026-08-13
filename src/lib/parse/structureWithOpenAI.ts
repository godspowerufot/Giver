import OpenAI, { toFile } from "openai";
import {
  STRUCTURE_PROMPT,
  parseAiStatementText,
} from "@/lib/parse/normalizeAiStatement";
import { dedupeTransactions } from "@/lib/parse/mergeStatements";
import type { ParseResult } from "@/lib/parse/parseFile";

/** Keep each OpenAI sheet/text chunk within practical context limits. */
const SHEET_CHUNK_ROWS = 120;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "AI structuring is not configured. Add OPENAI_API_KEY to .env.local.",
    );
  }
  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

function mimeForFile(file: File): string {
  const name = file.name.toLowerCase();
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

function splitSheetChunks(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [text];

  const header = lines[0];
  const rows = lines.slice(1);
  if (rows.length <= SHEET_CHUNK_ROWS) return [text];

  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += SHEET_CHUNK_ROWS) {
    const slice = rows.slice(i, i + SHEET_CHUNK_ROWS);
    chunks.push([header, ...slice].join("\n"));
  }
  return chunks;
}

function mergeAiParts(fileName: string, parts: ParseResult[]): ParseResult {
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

const USER_HINT = `Normalize this statement no matter the bank layout.
Map ANY columns/sheets into the JSON shape from the instructions.
Pull clean counterparty names from messy bank narrations when possible.
Return ONLY valid JSON.`;

async function generateFromTextChunk(
  client: OpenAI,
  model: string,
  fileName: string,
  sheetChunk: string,
  extraNote = "",
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: STRUCTURE_PROMPT },
      {
        role: "user",
        content: `File name: ${fileName}
${extraNote}

${USER_HINT}

--- STATEMENT DATA ---
${sheetChunk}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
}

async function generateFromUploadedFile(
  client: OpenAI,
  model: string,
  file: File,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await client.files.create({
    file: await toFile(buffer, file.name, { type: mimeForFile(file) }),
    purpose: "user_data",
  });

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: uploaded.id,
              detail: "low",
            },
            {
              type: "input_text",
              text: `${STRUCTURE_PROMPT}

File name: ${file.name}

${USER_HINT}
Read this Excel spreadsheet and extract every transaction you can.`,
            },
          ],
        },
      ],
      text: {
        format: { type: "json_object" },
      },
      temperature: 0.1,
    });

    const text =
      typeof response.output_text === "string"
        ? response.output_text.trim()
        : "";
    if (!text) throw new Error("OpenAI returned an empty response.");
    return text;
  } finally {
    await client.files.delete(uploaded.id).catch(() => undefined);
  }
}

async function structureDelimitedText(
  fileName: string,
  text: string,
): Promise<ParseResult> {
  const client = getClient();
  const model = getModel();
  const chunks = splitSheetChunks(text);

  console.info(`[giver] OpenAI text ${fileName}: ${chunks.length} chunk(s)`);

  const parts: ParseResult[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const raw = await generateFromTextChunk(
      client,
      model,
      fileName,
      chunks[i],
      chunks.length > 1
        ? `This is chunk ${i + 1} of ${chunks.length}. Extract every row in this chunk.`
        : "",
    );
    parts.push(parseAiStatementText(raw, fileName));
  }

  return mergeAiParts(fileName, parts);
}

function cellToPlainText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "object") return String(value);
  const v = value as Record<string, unknown>;
  if ("result" in v) return cellToPlainText(v.result);
  if (Array.isArray(v.richText)) {
    return (v.richText as { text?: string }[])
      .map((t) => t.text ?? "")
      .join("");
  }
  if (typeof v.text === "string") return v.text;
  return String(value);
}

async function workbookToCsvText(file: File): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
  const sheets: string[] = [];

  for (const worksheet of workbook.worksheets) {
    const rows: string[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as unknown[];
      const cells: string[] = [];
      for (let i = 1; i < values.length; i++) {
        cells.push(cellToPlainText(values[i]).replace(/\r?\n/g, " ").trim());
      }
      // Skip fully empty / duplicated merged banner noise later; keep all for AI.
      if (cells.every((c) => !c)) return;
      rows.push(cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(","));
    });
    if (rows.length) {
      sheets.push(`### Sheet: ${worksheet.name}\n${rows.join("\n")}`);
    }
  }

  if (!sheets.length) {
    throw new Error("No rows found in that Excel workbook.");
  }
  return sheets.join("\n\n");
}

/**
 * Structure a CSV/Excel statement into Giver Transaction[] via OpenAI.
 * Always used for uploads so any bank format is normalized before display.
 */
export async function structureStatementWithOpenAI(
  file: File,
): Promise<ParseResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || file.type === "text/csv") {
    console.info(`[giver] OpenAI structuring CSV ${file.name}`);
    return structureDelimitedText(file.name, await file.text());
  }

  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new Error("Unsupported file type. Upload Excel (.xlsx) only.");
  }

  // Prefer sheet→text for all worksheets (reliable, chunkable). File upload is fallback.
  if (name.endsWith(".xlsx")) {
    console.info(
      `[giver] OpenAI structuring Excel via sheet→text for ${file.name}`,
    );
    try {
      const csvLike = await workbookToCsvText(file);
      const parsed = await structureDelimitedText(file.name, csvLike);
      if (parsed.transactions.length) return parsed;
    } catch (err) {
      console.warn(
        `[giver] sheet→text failed; trying Excel file upload`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.info(`[giver] OpenAI reading Excel file upload ${file.name}`);
  const client = getClient();
  const model = getModel();
  const raw = await generateFromUploadedFile(client, model, file);
  const parsed = parseAiStatementText(raw, file.name);
  if (parsed.transactions.length) return parsed;

  throw new Error(
    "Could not read that Excel file with OpenAI. Try exporting as .xlsx or .csv.",
  );
}
