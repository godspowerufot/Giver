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
        source: "openai",
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

export const STRUCTURE_PROMPT = `You are a bank/wallet statement normalizer for the Giver app.
Any bank or wallet export may arrive — different columns, languages, multi-sheet Excel,
merged cells, rich text, debit/credit pairs, signed amounts, or messy narrations.
Your job: turn EVERY money movement into ONE clean JSON shape for ranking/presentation.

Return ONLY valid JSON (no markdown):

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
      "counterparty": string|null (person/business name for rankings),
      "bank": string|null,
      "account": string|null,
      "channel": string|null,
      "reference": string|null,
      "balanceAfter": number|null,
      "kind": "transfer" | "internal" | "fee" | "bill" | "other"
    }
  ]
}

Rules:
- Handle ANY layout. Map whatever headers exist into the fields above.
- Include every transaction across ALL sheets/pages; do not stop at the first table.
- Skip opening balance, totals, footers, ads, and marketing.
- direction "sent" = money out (debit); "received" = money in (credit).
- amount is always a positive number (no currency symbols).
- counterparty: extract the clearest person/merchant name from narration
  (e.g. "T EDWIN MICHEAL", "CIP/CR/USSD/ABRAHAM UDO BILL/OPAY" → "ABRAHAM UDO BILL",
  "Fincra Technologies Limited"). Use null for pure fees/airtime/SMS with no person.
- description: keep readable but concise (one line when possible).
- kind: fee for charges/VAT/stamp duty; bill for airtime/data/utilities/subscriptions;
  transfer for person/business payments; other otherwise.
- Column aliases (non-exhaustive): recipient/payee/beneficiary/merchant → counterparty;
  type/flow/debit|credit → direction; narration/details/memo → description;
  transaction_id/ref → reference; debit+credit OR signed amount → amount + direction.
- If the file is not a statement, return empty transactions.`;
