import type { TransactionKind } from "@/lib/types";

const INTERNAL_PATTERNS = [
  /owealth/i,
  /spend\s*&\s*save/i,
  /auto-?save/i,
  /add money/i,
  /vat on/i,
  /stamp duty/i,
  /ussd charge/i,
  /transfer fee/i,
];

const BILL_PATTERNS = [/mobile data/i, /airtime/i, /electricity/i, /cable/i];

export function classifyKind(description: string): TransactionKind {
  if (INTERNAL_PATTERNS.some((p) => p.test(description))) return "internal";
  if (/vat|stamp duty|ussd charge|fee/i.test(description)) return "fee";
  if (BILL_PATTERNS.some((p) => p.test(description))) return "bill";
  if (/transfer to|transfer from/i.test(description)) return "transfer";
  return "other";
}

export interface CounterpartyParts {
  name: string | null;
  bank: string | null;
  account: string | null;
}

/** Pull person/org from OPay-style descriptions */
export function extractCounterparty(description: string): CounterpartyParts {
  const cleaned = description.replace(/\s+/g, " ").trim();

  const toMatch = cleaned.match(
    /^Transfer to\s+(?:POS Transfer[-–]\s*)?(.+?)(?:\s*\|\s*(.+?))?(?:\s*\|\s*(.+?))?$/i,
  );
  if (toMatch) {
    return {
      name: normalizeName(toMatch[1]),
      bank: cleanPart(toMatch[2]),
      account: cleanPart(toMatch[3]),
    };
  }

  const fromMatch = cleaned.match(
    /^Transfer from\s+(.+?)(?:\s*\|\s*(.+?))?(?:\s*\|\s*(.+?))?(?:\s*\|\s*.+)?$/i,
  );
  if (fromMatch) {
    return {
      name: normalizeName(fromMatch[1]),
      bank: cleanPart(fromMatch[2]),
      account: cleanPart(fromMatch[3]),
    };
  }

  return { name: null, bank: null, account: null };
}

function cleanPart(value?: string): string | null {
  if (!value) return null;
  const v = value.trim();
  return v || null;
}

function normalizeName(raw: string): string {
  return raw
    .replace(/^POS Transfer[-–]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
