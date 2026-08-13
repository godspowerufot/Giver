export type ColumnMap = {
  date?: string;
  description?: string;
  /** Person/merchant column used by many wallet exports (recipient, payee…). */
  counterparty?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  direction?: string;
  balance?: string;
  channel?: string;
  reference?: string;
  mode: "debit_credit" | "signed_amount" | "direction_column" | "inferred";
};

const DATE_KEYS = [
  "trans. date",
  "trans date",
  "transaction date",
  "posted date",
  "posting date",
  "datetime",
  "date time",
  "date",
  "value date",
  "time",
];
const DESC_KEYS = [
  "description",
  "narration",
  "particulars",
  "details",
  "memo",
  "remarks",
  "narrative",
  "transaction details",
  "payment details",
];
const COUNTERPARTY_KEYS = [
  "recipient",
  "counterparty",
  "beneficiary",
  "payee",
  "payer",
  "sender",
  "merchant",
  "name",
  "to / from",
  "to/from",
  "party",
];
const DEBIT_KEYS = [
  "debit",
  "debit(₦)",
  "debit (₦)",
  "withdrawal",
  "money out",
  "amount out",
  "paid out",
  "dr",
];
const CREDIT_KEYS = [
  "credit",
  "credit(₦)",
  "credit (₦)",
  "deposit",
  "money in",
  "amount in",
  "paid in",
  "cr",
];
const AMOUNT_KEYS = [
  "amount",
  "amt",
  "transaction amount",
  "txn amount",
  "value",
  "sum",
];
const DIRECTION_KEYS = [
  "type",
  "direction",
  "txn type",
  "transaction type",
  "flow",
  "dr/cr",
  "credit/debit",
  "status",
];
const BALANCE_KEYS = [
  "balance after",
  "balance after(₦)",
  "running balance",
  "balance",
  "closing balance",
];
const CHANNEL_KEYS = ["channel", "source", "method", "payment method"];
const REF_KEYS = [
  "transaction id",
  "transaction_id",
  "transaction reference",
  "txn ref",
  "txn id",
  "reference",
  "ref",
  "id",
];

function norm(key: string): string {
  return key
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findKey(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));

  for (const candidate of candidates) {
    const c = norm(candidate);
    const exact = normalized.find((h) => h.n === c);
    if (exact) return exact.raw;
  }

  for (const candidate of candidates) {
    const c = norm(candidate);
    if (c.length < 4) continue;
    const hit = normalized.find((h) => {
      if (h.n === c) return true;
      const parts = h.n.split(/[^a-z0-9]+/).filter(Boolean);
      return parts.includes(c);
    });
    if (hit) return hit.raw;
  }

  return undefined;
}

export function detectColumns(headers: string[]): ColumnMap {
  const date = findKey(headers, DATE_KEYS);
  const description = findKey(headers, DESC_KEYS);
  const counterparty = findKey(headers, COUNTERPARTY_KEYS);
  const debit = findKey(headers, DEBIT_KEYS);
  const credit = findKey(headers, CREDIT_KEYS);
  const amount = findKey(headers, AMOUNT_KEYS);
  const direction = findKey(headers, DIRECTION_KEYS);
  const balance = findKey(headers, BALANCE_KEYS);
  const channel = findKey(headers, CHANNEL_KEYS);
  const reference = findKey(headers, REF_KEYS);

  let mode: ColumnMap["mode"] = "inferred";
  if (debit && credit) mode = "debit_credit";
  else if (direction && amount) mode = "direction_column";
  else if (amount) mode = "signed_amount";

  return {
    date,
    description: description ?? counterparty,
    counterparty,
    amount,
    debit,
    credit,
    direction,
    balance,
    channel,
    reference,
    mode,
  };
}

const SENT_TOKENS = [
  "sent",
  "debit",
  "dr",
  "out",
  "withdrawal",
  "expense",
  "payment",
  "transfer out",
];
const RECEIVED_TOKENS = [
  "received",
  "credit",
  "cr",
  "in",
  "deposit",
  "income",
  "transfer in",
];

export function parseDirectionToken(value: unknown): "sent" | "received" | null {
  const token = String(value ?? "")
    .toLowerCase()
    .trim();
  if (!token) return null;
  if (SENT_TOKENS.some((t) => token === t || token.includes(t))) return "sent";
  if (RECEIVED_TOKENS.some((t) => token === t || token.includes(t))) {
    return "received";
  }
  return null;
}
