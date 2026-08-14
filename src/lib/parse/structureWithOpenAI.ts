import { dedupeTransactions } from "@/lib/parse/mergeStatements";
import {
  STRUCTURE_PROMPT,
  parseAiStatementText,
} from "@/lib/parse/normalizeAiStatement";
import type { ParseResult } from "@/lib/parse/parseFile";
import OpenAI, { toFile } from "openai";

/** Keep each OpenAI sheet/text chunk small so JSON responses don't truncate. */
const SHEET_CHUNK_ROWS = 50;
const MAX_CHUNK_CHARS = 12_000;
/** Parallel OpenAI chunk calls — biggest XLSX speed win. */
const CHUNK_CONCURRENCY = 3;

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

/** Split multi-sheet dumps and large tables into small AI-safe chunks. */
function splitSheetChunks(text: string): string[] {
  const blocks = text.includes("### Sheet:")
    ? text
        .split(/(?=### Sheet:)/)
        .map((b) => b.trim())
        .filter(Boolean)
    : [text.trim()].filter(Boolean);

  const chunks: string[] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length) continue;

    let title: string | null = null;
    let headerIdx = 0;
    if (lines[0]?.startsWith("### Sheet:")) {
      title = lines[0] ?? null;
      headerIdx = 1;
    }

    if (lines.length <= headerIdx + 1) {
      chunks.push(block);
      continue;
    }

    const header = lines[headerIdx] ?? "";
    const rows = lines.slice(headerIdx + 1);
    if (rows.length <= SHEET_CHUNK_ROWS) {
      chunks.push(block);
      continue;
    }

    for (let i = 0; i < rows.length; i += SHEET_CHUNK_ROWS) {
      const slice = rows.slice(i, i + SHEET_CHUNK_ROWS);
      chunks.push(
        [title, header, ...slice]
          .filter((line) => line != null && line !== "")
          .join("\n"),
      );
    }
  }

  // Hard cap characters so one fat line can't blow the model output.
  const sized: string[] = [];
  for (const chunk of chunks.length ? chunks : [text]) {
    if (chunk.length <= MAX_CHUNK_CHARS) {
      sized.push(chunk);
      continue;
    }
    for (let i = 0; i < chunk.length; i += MAX_CHUNK_CHARS) {
      sized.push(chunk.slice(i, i + MAX_CHUNK_CHARS));
    }
  }

  return sized.length ? sized : [text];
}

function mergeAiParts(fileName: string, parts: ParseResult[]): ParseResult {
  const transactions = dedupeTransactions(
    parts.flatMap((p) => p.transactions),
  );
  const first = parts.find((p) => p.meta?.accountName || p.meta?.accountNumber)
    ?.meta;
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
Keep descriptions short. Return ONLY valid compact JSON.`;

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
    max_tokens: 8_000,
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

function parseChunkOrThrow(raw: string, fileName: string): ParseResult {
  const parsed = parseAiStatementText(raw, fileName);
  if (!parsed.transactions.length) {
    throw new Error("AI returned JSON with zero usable transactions.");
  }
  return parsed;
}

async function structureOneChunk(
  client: OpenAI,
  model: string,
  fileName: string,
  chunk: string,
  note: string,
): Promise<ParseResult> {
  const raw = await generateFromTextChunk(client, model, fileName, chunk, note);
  try {
    return parseChunkOrThrow(raw, fileName);
  } catch (err) {
    // Retry once with a clearer "compact JSON" reminder.
    console.warn(
      `[giver] chunk JSON parse failed; retrying compact`,
      err instanceof Error ? err.message : err,
    );
    const retryRaw = await generateFromTextChunk(
      client,
      model,
      fileName,
      chunk,
      `${note}\nIMPORTANT: Previous reply was invalid/truncated JSON. Return fewer fields, shorter descriptions, valid JSON only.`,
    );
    return parseChunkOrThrow(retryRaw, fileName);
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}

async function structureDelimitedText(
  fileName: string,
  text: string,
): Promise<ParseResult> {
  const client = getClient();
  const model = getModel();
  const chunks = splitSheetChunks(text);

  console.info(
    `[giver] OpenAI text ${fileName}: ${chunks.length} chunk(s), concurrency=${CHUNK_CONCURRENCY}`,
  );

  const settled = await mapPool(chunks, CHUNK_CONCURRENCY, async (chunk, i) => {
    try {
      return await structureOneChunk(
        client,
        model,
        fileName,
        chunk,
        chunks.length > 1
          ? `This is chunk ${i + 1} of ${chunks.length}. Extract every money row in THIS chunk only.`
          : "Extract every money row in this data.",
      );
    } catch (err) {
      const lines = chunk.split(/\r?\n/);
      if (lines.length < 8) {
        console.warn(
          `[giver] skipping failed tiny chunk ${i + 1}`,
          err instanceof Error ? err.message : err,
        );
        return null;
      }
      const mid = Math.ceil(lines.length / 2);
      const halves = [
        lines.slice(0, mid).join("\n"),
        lines.slice(mid).join("\n"),
      ];
      console.warn(
        `[giver] chunk ${i + 1} failed; splitting into ${halves.length} halves`,
      );
      const recovered: ParseResult[] = [];
      for (const half of halves) {
        try {
          const parsed = await structureOneChunk(
            client,
            model,
            fileName,
            half,
            `Continuation chunk. Extract every money row here only. Compact valid JSON.`,
          );
          if (parsed.transactions.length) recovered.push(parsed);
        } catch (halfErr) {
          console.warn(
            `[giver] half-chunk skipped`,
            halfErr instanceof Error ? halfErr.message : halfErr,
          );
        }
      }
      if (!recovered.length) return null;
      return mergeAiParts(fileName, recovered);
    }
  });

  const parts = settled.filter((p): p is ParseResult => Boolean(p?.transactions.length));

  if (!parts.length) {
    throw new Error(
      "Could not read money rows from that statement. Try a fresh .xlsx or .csv export and upload again.",
    );
  }

  return mergeAiParts(fileName, parts);
}

/** Legacy .xls only — whole-file upload truncates on big statements. */
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
Read this spreadsheet. Return compact valid JSON only.
If there are many rows, prioritize complete valid JSON over listing every single row.`,
            },
          ],
        },
      ],
      text: {
        format: { type: "json_object" },
      },
      temperature: 0.1,
      max_output_tokens: 8_000,
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

function cellToPlainText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "object") return String(value);
  const v = value as Record<string, unknown>;
  if ("result" in v) return cellToPlainText(v.result);
  if (Array.isArray(v.richText)) {
    return (v.richText as { text?: string }[])
      .map((t) => t?.text ?? "")
      .join("");
  }
  if (typeof v.text === "string") return v.text;
  return String(value);
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tagRe(name: string, flags = "gi"): RegExp {
  return new RegExp(`<(?:\\w+:)?${name}\\b([^>]*)>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, flags);
}

function selfOrOpenTagRe(name: string): RegExp {
  return new RegExp(
    `<(?:\\w+:)?${name}\\b([^>]*)(?:\\/>|>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>)`,
    "gi",
  );
}

function readSharedStrings(xml: string): string[] {
  const shared: string[] = [];
  for (const si of xml.matchAll(tagRe("si"))) {
    const inner = si[2] ?? "";
    const parts = [...inner.matchAll(tagRe("t", "gi"))].map((m) =>
      decodeXmlEntities(m[2] ?? ""),
    );
    shared.push(parts.join(""));
  }
  // Some exporters omit <si> and only use flat <t> — last resort index order.
  if (!shared.length) {
    for (const match of xml.matchAll(tagRe("t", "gi"))) {
      shared.push(decodeXmlEntities(match[2] ?? ""));
    }
  }
  return shared;
}

function cellTextFromXml(
  attrs: string,
  body: string,
  shared: string[],
): string {
  const type = /\bt="([^"]*)"/.exec(attrs)?.[1];
  if (type === "s") {
    const idx = Number(
      /<(?:\w+:)?v\b[^>]*>(\d+)<\/(?:\w+:)?v>/i.exec(body)?.[1] ?? -1,
    );
    return shared[idx] ?? "";
  }
  if (type === "inlineStr" || type === "str") {
    const inline = [...body.matchAll(tagRe("t", "gi"))]
      .map((m) => decodeXmlEntities(m[2] ?? ""))
      .join("");
    if (inline) return inline;
  }
  const v = /<(?:\w+:)?v\b[^>]*>([^<]*)<\/(?:\w+:)?v>/i.exec(body)?.[1];
  return v != null ? decodeXmlEntities(v) : "";
}

/** ExcelJS sometimes throws on bank exports (`undefined.sheets`). Zip dump still feeds OpenAI. */
async function zipXlsxToPlainText(file: File): Promise<string> {
  const zipMod = await import("jszip");
  const JSZip = zipMod.default ?? zipMod;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const sharedFile =
    zip.file("xl/sharedStrings.xml") ??
    Object.keys(zip.files ?? {})
      .filter((n) => /sharedstrings\.xml$/i.test(n))
      .map((n) => zip.file(n))[0] ??
    null;
  const shared = sharedFile
    ? readSharedStrings(await sharedFile.async("string"))
    : [];

  const sheetNames = Object.keys(zip.files ?? {})
    .filter((name) => /xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const parts: string[] = [];
  for (const sheetName of sheetNames) {
    const sheetFile = zip.file(sheetName);
    if (!sheetFile) continue;
    const xml = await sheetFile.async("string");
    const rows: string[] = [];

    for (const rowMatch of xml.matchAll(tagRe("row"))) {
      const rowXml = rowMatch[2] ?? "";
      const cells: string[] = [];
      for (const cellMatch of rowXml.matchAll(selfOrOpenTagRe("c"))) {
        const attrs = cellMatch[1] ?? "";
        const body = cellMatch[2] ?? "";
        cells.push(cellTextFromXml(attrs, body, shared).replace(/\r?\n/g, " ").trim());
      }
      if (cells.some((c) => c)) {
        rows.push(cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(","));
      }
    }

    // Fallback: strip tags into line-ish text if row parsing failed.
    if (!rows.length) {
      const loose = xml
        .replace(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi, " $1 ")
        .replace(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/gi, " $1 ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (loose) {
        // Break long blob into ~120-word lines so chunking works.
        const words = loose.split(" ");
        for (let i = 0; i < words.length; i += 40) {
          rows.push(words.slice(i, i + 40).join(" "));
        }
      }
    }

    console.info(
      `[giver] zip sheet ${sheetName}: ${rows.length} row(s), sharedStrings=${shared.length}`,
    );

    if (rows.length) {
      parts.push(`### Sheet: ${sheetName}\n${rows.join("\n")}`);
    }
  }

  if (!parts.length) {
    throw new Error("No rows found in that Excel workbook.");
  }
  return parts.join("\n\n");
}

async function excelJsWorkbookToCsvText(file: File): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const bytes = new Uint8Array(await file.arrayBuffer());
  await workbook.xlsx.load(bytes as never);

  const worksheets = workbook?.worksheets ?? [];
  if (!worksheets.length) {
    throw new Error("No worksheet found in that Excel workbook.");
  }

  const sheets: string[] = [];
  for (const worksheet of worksheets) {
    if (!worksheet) continue;
    const rows: string[] = [];
    worksheet.eachRow?.({ includeEmpty: false }, (row) => {
      const values = (row?.values ?? []) as unknown[];
      const cells: string[] = [];
      for (let i = 1; i < (values?.length ?? 0); i++) {
        cells.push(
          cellToPlainText(values?.[i]).replace(/\r?\n/g, " ").trim(),
        );
      }
      if (cells.every((c) => !c)) return;
      rows.push(cells.map((c) => `"${c.replace(/"/g, '""')}"`).join(","));
    });
    if (rows.length) {
      sheets.push(`### Sheet: ${worksheet?.name ?? "Sheet"}\n${rows.join("\n")}`);
    }
  }

  if (!sheets.length) {
    throw new Error("No rows found in that Excel workbook.");
  }
  return sheets.join("\n\n");
}

async function workbookToCsvText(file: File): Promise<string> {
  // Zip-first: bank XLSX often breaks ExcelJS, and zip is much faster.
  try {
    const zipText = await zipXlsxToPlainText(file);
    const rows = zipText.split(/\r?\n/).filter((l) => l.trim()).length;
    if (rows >= 3) {
      console.info(`[giver] XLSX→text via zip (${rows} lines)`);
      return zipText;
    }
  } catch (err) {
    console.info(
      `[giver] zip sheet text failed; trying ExcelJS`,
      err instanceof Error ? err.message : err,
    );
  }

  console.info(`[giver] XLSX→text via ExcelJS`);
  return excelJsWorkbookToCsvText(file);
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

  // .xlsx: always sheet→text in small chunks (avoids truncated whole-file JSON).
  if (name.endsWith(".xlsx")) {
    console.info(
      `[giver] OpenAI structuring Excel via sheet→text for ${file.name}`,
    );
    const csvLike = await workbookToCsvText(file);
    return structureDelimitedText(file.name, csvLike);
  }

  // Legacy .xls: ExcelJS can't read it; use file upload + JSON salvage.
  if (name.endsWith(".xls")) {
    console.info(`[giver] OpenAI reading legacy .xls upload ${file.name}`);
    const client = getClient();
    const model = getModel();
    const raw = await generateFromUploadedFile(client, model, file);
    const parsed = parseAiStatementText(raw, file.name);
    if (parsed.transactions.length) return parsed;
  }

  throw new Error(
    "Could not read that Excel file with OpenAI. Try exporting as .xlsx or .csv.",
  );
}
