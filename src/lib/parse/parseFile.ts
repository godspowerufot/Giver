import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { Direction, StatementMeta, Transaction } from "@/lib/types";
import { detectColumns, parseDirectionToken, type ColumnMap } from "./detectColumns";
import { classifyKind, extractCounterparty } from "./extractCounterparty";
import { parseAmount, parseDate } from "./money";

export interface ParseResult {
  transactions: Transaction[];
  meta: StatementMeta;
}

function cell(row: Record<string, unknown>, key?: string): unknown {
  if (!key) return undefined;
  return row[key];
}

function rowToStrings(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v == null ? "" : String(v);
  }
  return out;
}

function resolveDirection(
  map: ColumnMap,
  row: Record<string, unknown>,
  description: string,
  amount: number,
): Direction {
  if (map.mode === "debit_credit") {
    const debit = parseAmount(cell(row, map.debit));
    const credit = parseAmount(cell(row, map.credit));
    if (debit && debit > 0) return "sent";
    if (credit && credit > 0) return "received";
  }

  if (map.direction) {
    const fromCol = parseDirectionToken(cell(row, map.direction));
    if (fromCol) return fromCol;
  }

  if (map.mode === "signed_amount") {
    if (amount < 0) return "sent";
    if (amount > 0) return "received";
  }

  if (/^transfer to/i.test(description)) return "sent";
  if (/^transfer from/i.test(description)) return "received";

  return "unknown";
}

function resolveAmount(map: ColumnMap, row: Record<string, unknown>): number {
  if (map.mode === "debit_credit") {
    const debit = parseAmount(cell(row, map.debit)) ?? 0;
    const credit = parseAmount(cell(row, map.credit)) ?? 0;
    if (debit > 0) return debit;
    if (credit > 0) return credit;
    return 0;
  }

  return Math.abs(parseAmount(cell(row, map.amount)) ?? 0);
}

function findHeaderRow(matrix: unknown[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 40); i++) {
    const row = matrix[i] ?? [];
    const joined = row.map((c) => String(c ?? "").toLowerCase()).join(" | ");
    if (
      (joined.includes("description") || joined.includes("narration")) &&
      (joined.includes("debit") || joined.includes("credit") || joined.includes("amount"))
    ) {
      return i;
    }
  }
  return 0;
}

function extractMetaFromPreamble(
  matrix: unknown[][],
  headerIndex: number,
): Partial<StatementMeta> {
  const meta: Partial<StatementMeta> = {};
  for (let i = 0; i < headerIndex; i++) {
    const row = matrix[i] ?? [];
    const cells = row.map((c) => (c == null ? "" : String(c).trim()));
    for (let j = 0; j < cells.length - 1; j++) {
      const label = cells[j].toLowerCase();
      const value = cells[j + 1];
      if (!value) continue;
      if (label === "account name") meta.accountName = value;
      if (label === "account number") meta.accountNumber = value;
      if (label === "period") meta.period = value;
    }
  }
  return meta;
}

function matrixToObjects(matrix: unknown[][]): {
  rows: Record<string, unknown>[];
  map: ColumnMap;
  preambleMeta: Partial<StatementMeta>;
} {
  const headerIndex = findHeaderRow(matrix);
  const headerRow = (matrix[headerIndex] ?? []).map((h, idx) => {
    const label = String(h ?? "").trim();
    return label || `col_${idx}`;
  });

  const rows: Record<string, unknown>[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    if (line.every((c) => c == null || String(c).trim() === "")) continue;
    const obj: Record<string, unknown> = {};
    headerRow.forEach((key, idx) => {
      obj[key] = line[idx];
    });
    rows.push(obj);
  }

  return {
    rows,
    map: detectColumns(headerRow),
    preambleMeta: extractMetaFromPreamble(matrix, headerIndex),
  };
}

function buildTransactions(
  rows: Record<string, unknown>[],
  map: ColumnMap,
): Transaction[] {
  const out: Transaction[] = [];

  rows.forEach((row, index) => {
    const description = String(cell(row, map.description) ?? "").trim();
    if (!description) return;

    const amount = resolveAmount(map, row);
    if (!amount || amount <= 0) return;

    const direction = resolveDirection(map, row, description, amount);
    const parts = extractCounterparty(description);
    const kind = classifyKind(description);
    const date = parseDate(cell(row, map.date));

    out.push({
      id: `${index}-${String(cell(row, map.reference) ?? description).slice(0, 24)}`,
      date,
      description,
      amount,
      direction,
      counterparty: parts.name,
      bank: parts.bank,
      account: parts.account,
      channel: cell(row, map.channel) != null ? String(cell(row, map.channel)) : null,
      reference:
        cell(row, map.reference) != null ? String(cell(row, map.reference)) : null,
      balanceAfter: parseAmount(cell(row, map.balance)),
      kind,
      raw: rowToStrings(row),
    });
  });

  return out;
}

function parseDelimitedText(text: string, fileName: string): ParseResult {
  const preview = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: false,
  });

  const matrix = preview.data as unknown[][];
  const { rows, map, preambleMeta } = matrixToObjects(matrix);
  const transactions = buildTransactions(rows, map);

  return {
    transactions,
    meta: {
      ...preambleMeta,
      fileName,
      detectedMode: map.mode,
    },
  };
}

async function parseCsv(file: File): Promise<ParseResult> {
  const text = await file.text();
  return parseDelimitedText(text, file.name);
}

function excelCellValue(value: ExcelJS.CellValue): unknown {
  if (value == null || typeof value !== "object") return value ?? null;

  if ("result" in value) {
    return value.result ?? null;
  }
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((t) => t.text).join("");
  }
  if ("text" in value && typeof value.text === "string") {
    return value.text;
  }
  if ("hyperlink" in value && "text" in value) {
    return value.text;
  }
  return String(value);
}

async function parseWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const preferred =
    workbook.worksheets.find((ws) => /wallet/i.test(ws.name)) ??
    workbook.worksheets[0];
  if (!preferred) throw new Error("No worksheet found in workbook");

  const matrix: unknown[][] = [];
  preferred.eachRow({ includeEmpty: true }, (row) => {
    const values = row.values as ExcelJS.CellValue[];
    // exceljs is 1-indexed
    const line: unknown[] = [];
    const len = Math.max(values.length - 1, 0);
    for (let i = 1; i <= len; i++) {
      line.push(excelCellValue(values[i]));
    }
    matrix.push(line);
  });

  const { rows, map, preambleMeta } = matrixToObjects(matrix);
  const transactions = buildTransactions(rows, map);

  return {
    transactions,
    meta: {
      ...preambleMeta,
      fileName: file.name,
      sheetName: preferred.name,
      detectedMode: map.mode,
    },
  };
}

export async function parseLedgerFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseWorkbook(file);
  }
  try {
    return await parseWorkbook(file);
  } catch {
    return parseCsv(file);
  }
}
