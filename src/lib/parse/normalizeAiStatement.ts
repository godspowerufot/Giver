import { classifyKind } from "@/lib/parse/extractCounterparty";
import { parseDate } from "@/lib/parse/money";
import type {
  Direction,
  StatementMeta,
  Transaction,
  TransactionKind,
} from "@/lib/types";
import type { ParseResult } from "@/lib/parse/parseFile";

export type AiStatementRow = {
  date?: string | null;
  description?: string | null;
  amount?: number | string | null;
  direction?: string | null;
  counterparty?: string | null;
  bank?: string | null;
  account?: string | null;
  channel?: string | null;
  reference?: string | null;
  balanceAfter?: number | string | null;
  kind?: string | null;
};

export type AiStatementPayload = {
  accountName?: string | null;
  accountNumber?: string | null;
  period?: string | null;
  transactions: AiStatementRow[];
};

const KINDS = new Set<TransactionKind>([
  "transfer",
  "internal",
  "fee",
  "bill",
  "other",
]);

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/[₦N$£€]/gi, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asDirection(value: unknown): Direction {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["sent", "debit", "out", "withdrawal", "transfer out"].includes(raw)) {
    return "sent";
  }
  if (["received", "credit", "in", "deposit", "transfer in"].includes(raw)) {
    return "received";
  }
  return "unknown";
}

function asKind(value: unknown, description: string): TransactionKind {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase() as TransactionKind;
  if (KINDS.has(raw)) return raw;
  return classifyKind(description);
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return structured JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export function normalizeAiStatement(
  payload: unknown,
  fileName: string,
): ParseResult {
  const data = payload as AiStatementPayload;
  if (!data || !Array.isArray(data.transactions)) {
    throw new Error("AI response was missing a transactions array.");
  }

  const transactions: Transaction[] = [];

  data.transactions.forEach((row, index) => {
    const description = String(row.description ?? "").trim() || "Transaction";
    const amount = Math.abs(asNumber(row.amount) ?? 0);
    if (!amount) return;

    const direction = asDirection(row.direction);
    const counterparty = row.counterparty
      ? String(row.counterparty).trim() || null
      : null;
    const kind = asKind(row.kind, description);
    const balanceAfter = asNumber(row.balanceAfter);

    transactions.push({
      id: `ai-${index}-${description.slice(0, 24)}`,
      date: parseDate(row.date ?? null),
      description,
      amount,
      direction,
      counterparty,
      bank: row.bank ? String(row.bank).trim() || null : null,
      account: row.account ? String(row.account).trim() || null : null,
      channel: row.channel ? String(row.channel).trim() || null : null,
      reference: row.reference ? String(row.reference).trim() || null : null,
      balanceAfter,
      kind,
      raw: {
        source: "gemini",
        description,
        amount: String(amount),
        direction,
        counterparty: counterparty ?? "",
      },
    });
  });

  const meta: StatementMeta = {
    accountName: data.accountName ? String(data.accountName) : undefined,
    accountNumber: data.accountNumber ? String(data.accountNumber) : undefined,
    period: data.period ? String(data.period) : undefined,
    fileName,
    detectedMode: "ai_structured",
  };

  return { transactions, meta };
}

export function parseAiStatementText(text: string, fileName: string): ParseResult {
  return normalizeAiStatement(extractJsonObject(text), fileName);
}

export const STRUCTURE_PROMPT = `You are a bank/wallet statement parser for the Giver app.
Read the attached statement and return ONLY valid JSON (no markdown) matching:

{
  "accountName": string|null,
  "accountNumber": string|null,
  "period": string|null,
  "transactions": [
    {
      "date": "YYYY-MM-DD" or null,
      "description": string,
      "amount": number (absolute positive money value),
      "direction": "sent" | "received" | "unknown",
      "counterparty": string|null (person/business for person transfers),
      "bank": string|null,
      "account": string|null,
      "channel": string|null,
      "reference": string|null,
      "balanceAfter": number|null,
      "kind": "transfer" | "internal" | "fee" | "bill" | "other"
    }
  ]
}

Rules for clean presentation:
- Include every money movement you can confidently extract.
- direction "sent" = money leaving the account; "received" = money entering.
- Prefer real counterparty names for person-to-person transfers; null for fees/bills/airtime if no person.
- amount must be a positive number without currency symbols (use absolute value if signed).
- Ignore headers, footers, ads, page numbers, and marketing.
- Keep descriptions concise and readable for charts and rankings.
- Different banks use different headers — map them. Examples:
  recipient/payee/beneficiary/merchant → counterparty
  type/flow/txn type (sent|received|debit|credit) → direction
  narration/details/memo → description
  transaction_id / ref / reference → reference
  debit+credit columns OR a signed amount column → amount + direction
- If the file is not a statement, return empty transactions.`;
