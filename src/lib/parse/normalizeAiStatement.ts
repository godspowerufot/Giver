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
    const cleaned = value
      .replace(/,/g, "")
      .replace(/[₦N$£€]/gi, "")
      .replace(/\bNGN\b/gi, "")
      .replace(/\s/g, "")
      .trim();
    if (!cleaned || cleaned === "-" || cleaned === "--") return null;
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

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  if (start === -1) {
    throw new Error("AI did not return structured JSON.");
  }
  const end = candidate.lastIndexOf("}");
  if (end > start) return candidate.slice(start, end + 1);
  // Truncated response — keep from first `{` and try to repair below.
  return candidate.slice(start);
}

function closeOpenJson(fragment: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < fragment.length; i++) {
    const ch = fragment[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" || ch === "]") stack.pop();
  }

  let out = fragment;
  if (inString) out += '"';
  // Drop a trailing comma before we close.
  out = out.replace(/,\s*$/, "");
  while (stack.length) {
    const open = stack.pop();
    out += open === "{" ? "}" : "]";
  }
  return out;
}

/** Pull complete transaction objects from a truncated AI payload. */
function salvageTransactionsPayload(text: string): unknown | null {
  const txKey = text.search(/"transactions"\s*:/);
  if (txKey < 0) return null;
  const afterKey = text.slice(txKey);
  const arrStart = afterKey.indexOf("[");
  if (arrStart < 0) return null;
  const arrBody = afterKey.slice(arrStart + 1);

  const transactions: unknown[] = [];
  let i = 0;
  while (i < arrBody.length) {
    while (i < arrBody.length && /[\s,]/.test(arrBody[i]!)) i++;
    if (arrBody[i] === "]") break;
    if (arrBody[i] !== "{") break;

    let depth = 0;
    let inString = false;
    let escape = false;
    const start = i;
    let end = -1;
    for (; i < arrBody.length; i++) {
      const ch = arrBody[i]!;
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          i++;
          break;
        }
      }
    }
    if (end < 0) break;
    try {
      transactions.push(JSON.parse(arrBody.slice(start, end)));
    } catch {
      break;
    }
  }

  if (!transactions.length) return null;
  return {
    accountName: null,
    accountNumber: null,
    period: null,
    transactions,
  };
}

function extractJsonObject(text: string): unknown {
  const candidate = extractJsonCandidate(text);

  try {
    return JSON.parse(candidate);
  } catch {
    /* repair / salvage below */
  }

  try {
    return JSON.parse(closeOpenJson(candidate));
  } catch {
    /* salvage below */
  }

  const salvaged = salvageTransactionsPayload(candidate);
  if (salvaged) {
    console.warn(
      "[giver] AI JSON was truncated; salvaged complete transactions only",
    );
    return salvaged;
  }

  throw new Error("AI did not return structured JSON.");
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
    // Prefer explicit amount; some models put debit/credit in odd fields.
    let amount = Math.abs(asNumber(row.amount) ?? 0);
    if (!amount) {
      const raw = row as Record<string, unknown>;
      amount = Math.abs(
        asNumber(raw.debit) ??
          asNumber(raw.credit) ??
          asNumber(raw.Debit) ??
          asNumber(raw.Credit) ??
          0,
      );
    }
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
- Keep JSON compact: short descriptions, null for unused optional fields.
- For a CHUNK of rows: only extract rows in that chunk; still return full JSON shape.
- kind: fee for charges/VAT/stamp duty; bill for airtime/data/utilities/subscriptions;
  transfer for person/business payments; other otherwise.
- Column aliases (non-exhaustive): recipient/payee/beneficiary/merchant → counterparty;
  type/flow/debit|credit → direction; narration/details/memo → description;
  transaction_id/ref → reference; debit+credit OR signed amount → amount + direction.
- If the file is not a statement, return empty transactions.`;
