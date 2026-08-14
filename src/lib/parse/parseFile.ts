import ExcelJS from "exceljs";
import Papa from "papaparse";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import type { Direction, StatementMeta, Transaction } from "@/lib/types";
import { detectColumns, parseDirectionToken, type ColumnMap } from "./detectColumns";
import { classifyKind, extractCounterparty } from "./extractCounterparty";
import { parseAmount, parseDate } from "./money";

export interface ParseResult {
  transactions: Transaction[];
  meta: StatementMeta;
  /** Present for local spreadsheet/matrix parses. */
  columnMap?: ColumnMap;
  /** Non-empty source rows before transaction filtering. */
  sourceRowCount?: number;
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
    const hasMoney =
      joined.includes("debit") ||
      joined.includes("credit") ||
      joined.includes("amount");
    const hasLabel =
      joined.includes("description") ||
      joined.includes("narration") ||
      joined.includes("recipient") ||
      joined.includes("particulars") ||
      joined.includes("details");
    if (hasMoney && (hasLabel || joined.includes("type") || joined.includes("date"))) {
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
    // Unique cells only — bank PDFs-to-Excel often duplicate merged cells.
    const unique = [...new Set(cells.filter(Boolean))];
    for (const cellText of unique) {
      const accountName = cellText.match(/account\s*name\s*:\s*(.+?)(?:\s{2,}|$)/i);
      if (accountName?.[1]) {
        meta.accountName = accountName[1].replace(/\s+Savings Account.*$/i, "").trim();
      }
      const accountNo = cellText.match(/account\s*no\.?\s*:\s*([0-9]+)/i);
      if (accountNo?.[1]) meta.accountNumber = accountNo[1];
      const period = cellText.match(/period\s*:\s*(.+)$/i);
      if (period?.[1]) meta.period = period[1].trim();
    }
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

export function parseFromMatrix(
  matrix: unknown[][],
  fileName: string,
  sheetName?: string,
): ParseResult {
  const { rows, map, preambleMeta } = matrixToObjects(matrix);
  const transactions = buildTransactions(rows, map);
  return {
    transactions,
    meta: {
      ...preambleMeta,
      fileName,
      sheetName,
      detectedMode: map.mode,
    },
    columnMap: map,
    sourceRowCount: rows.length,
  };
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
    const description = String(
      cell(row, map.description) ?? cell(row, map.counterparty) ?? "",
    ).trim();
    if (!description) return;
    if (/^(opening balance|totals?|total\b)/i.test(description)) return;

    const amount = resolveAmount(map, row);
    if (!amount || amount <= 0) return;

    const direction = resolveDirection(map, row, description, amount);
    const fromCol = map.counterparty
      ? String(cell(row, map.counterparty) ?? "").trim() || null
      : null;
    const parts = extractCounterparty(description);
    const kind = classifyKind(description);
    const date = parseDate(cell(row, map.date));

    out.push({
      id: `${index}-${String(cell(row, map.reference) ?? description).slice(0, 24)}`,
      date,
      description,
      amount,
      direction,
      counterparty: fromCol || parts.name,
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

function excelCellValue(value: ExcelJS.CellValue): unknown {
  if (value == null || typeof value !== "object") return value ?? null;
  if (value instanceof Date) return value;

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

function worksheetToMatrix(ws: ExcelJS.Worksheet): unknown[][] {
  const matrix: unknown[][] = [];
  ws?.eachRow?.({ includeEmpty: true }, (row) => {
    const values = (row?.values ?? []) as ExcelJS.CellValue[];
    const line: unknown[] = [];
    const len = Math.max((values?.length ?? 1) - 1, 0);
    for (let i = 1; i <= len; i++) {
      line.push(excelCellValue(values?.[i]));
    }
    matrix.push(line);
  });
  return matrix;
}

function rowLooksLikeHeader(row: unknown[]): boolean {
  const joined = row.map((c) => String(c ?? "").toLowerCase()).join(" | ");
  const hasMoney =
    joined.includes("debit") ||
    joined.includes("credit") ||
    joined.includes("amount");
  const hasLabel =
    joined.includes("description") ||
    joined.includes("narration") ||
    joined.includes("recipient") ||
    joined.includes("particulars") ||
    joined.includes("details");
  return hasMoney && (hasLabel || joined.includes("type") || joined.includes("date"));
}

function rowLooksLikeFooter(row: unknown[]): boolean {
  const text = row.map((c) => String(c ?? "").toLowerCase()).join(" ");
  return (
    /\btotals?\b/.test(text) ||
    /cleared\s*\+?\s*uncleared/.test(text) ||
    /customer contact center/.test(text) ||
    /opening balance/.test(text)
  );
}

/**
 * Bank exports often split one statement across "Table 1", "Table 2", …
 * Keep the first header + preamble, then append continuation data rows.
 */
function mergeWorkbookMatrices(sheets: unknown[][][]): unknown[][] {
  if (!sheets.length) return [];
  if (sheets.length === 1) return sheets[0];

  let headerSheetIdx = sheets.findIndex((m) =>
    m.some((row) => rowLooksLikeHeader(row)),
  );
  if (headerSheetIdx < 0) headerSheetIdx = 0;

  const headerSheet = sheets[headerSheetIdx];
  const headerIndex = findHeaderRow(headerSheet);
  const combined: unknown[][] = headerSheet.slice(0, headerIndex + 1);

  for (let s = 0; s < sheets.length; s++) {
    const matrix = sheets[s];
    const start =
      s === headerSheetIdx
        ? headerIndex + 1
        : rowLooksLikeHeader(matrix[0] ?? [])
          ? 1
          : 0;

    for (let i = start; i < matrix.length; i++) {
      const row = matrix[i] ?? [];
      if (row.every((c) => c == null || String(c).trim() === "")) continue;
      if (rowLooksLikeFooter(row)) continue;
      combined.push(row);
    }
  }

  return combined;
}

async function parseWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheets = workbook?.worksheets ?? [];
  if (!worksheets.length) {
    throw new Error("No worksheet found in workbook");
  }

  const sheets = worksheets.map((ws) => worksheetToMatrix(ws));
  const matrix = mergeWorkbookMatrices(sheets);
  const sheetName = worksheets.map((ws) => ws?.name ?? "Sheet").join(" + ");

  console.info(
    `[giver] Excel ${file.name}: ${worksheets.length} sheet(s) → ${matrix.length} rows`,
  );

  return parseFromMatrix(matrix, file.name, sheetName);
}

function parseDelimitedText(text: string, fileName: string): ParseResult {
  const preview = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: false,
  });
  return parseFromMatrix(preview.data as unknown[][], fileName);
}

async function parseCsv(file: File): Promise<ParseResult> {
  const text = await file.text();
  return parseDelimitedText(text, file.name);
}

export async function parseLedgerFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(file);
  }
  if (name.endsWith(".xlsx")) {
    return parseWorkbook(file);
  }
  // .xls is accepted for upload but needs structuring (exceljs is .xlsx-only).
  throw new Error(SPREADSHEET_TOAST);
}

export function isStatementFile(file: File) {
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
