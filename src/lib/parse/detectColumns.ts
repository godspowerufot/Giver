export type ColumnMap = {
  date?: string;
  description?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  direction?: string;
  balance?: string;
  channel?: string;
  reference?: string;
  mode: "debit_credit" | "signed_amount" | "direction_column" | "inferred";
};

const DATE_KEYS = ["trans. date", "trans date", "date", "value date", "transaction date"];
const DESC_KEYS = ["description", "narration", "details", "memo", "particulars"];
const DEBIT_KEYS = ["debit", "debit(₦)", "debit (₦)", "withdrawal", "money out", "dr"];
const CREDIT_KEYS = ["credit", "credit(₦)", "credit (₦)", "deposit", "money in", "cr"];
const AMOUNT_KEYS = ["amount", "amt", "transaction amount", "value"];
const DIRECTION_KEYS = ["type", "direction", "txn type", "transaction type", "dr/cr"];
const BALANCE_KEYS = ["balance after", "balance after(₦)", "balance", "running balance"];
const CHANNEL_KEYS = ["channel", "source"];
const REF_KEYS = ["transaction reference", "reference", "ref", "txn ref"];

function norm(key: string): string {
  return key.toLowerCase().replace(/\s+/g, " ").trim();
}

function findKey(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, n: norm(h) }));
  for (const candidate of candidates) {
    const hit = normalized.find((h) => h.n === candidate || h.n.includes(candidate));
    if (hit) return hit.raw;
  }
  return undefined;
}

export function detectColumns(headers: string[]): ColumnMap {
  const date = findKey(headers, DATE_KEYS);
  const description = findKey(headers, DESC_KEYS);
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
    description,
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

const SENT_TOKENS = ["sent", "debit", "dr", "out", "withdrawal", "expense", "payment"];
const RECEIVED_TOKENS = ["received", "credit", "cr", "in", "deposit", "income"];

export function parseDirectionToken(value: unknown): "sent" | "received" | null {
  const token = String(value ?? "")
    .toLowerCase()
    .trim();
  if (!token) return null;
  if (SENT_TOKENS.some((t) => token === t || token.includes(t))) return "sent";
  if (RECEIVED_TOKENS.some((t) => token === t || token.includes(t))) return "received";
  return null;
}
