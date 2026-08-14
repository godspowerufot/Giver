/** Max date span for one upload — keeps OpenAI chunks/tokens sane. */
export const MAX_STATEMENT_MONTHS = 5;

/** Soft row cap when dates can't be read (~5 months of busy wallet use). */
export const MAX_STATEMENT_DATA_ROWS = 450;

export const STATEMENT_RANGE_HINT =
  "Abeg upload small small — one month or two months better. Maximum 5 months for one file. Full-year statement go waste tokens and fit fail.";

export class StatementTooLargeError extends Error {
  constructor(message: string = STATEMENT_RANGE_HINT) {
    super(message);
    this.name = "StatementTooLargeError";
  }
}

function monthsBetween(a: Date, b: Date): number {
  const min = a < b ? a : b;
  const max = a < b ? b : a;
  return (
    (max.getUTCFullYear() - min.getUTCFullYear()) * 12 +
    (max.getUTCMonth() - min.getUTCMonth())
  );
}

function collectDates(text: string): Date[] {
  const dates: Date[] = [];

  for (const match of text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    const d = new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12),
    );
    if (!Number.isNaN(d.getTime())) dates.push(d);
  }

  for (const match of text.matchAll(
    /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](20\d{2})\b/g,
  )) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    const d = new Date(Date.UTC(year, month - 1, day, 12));
    if (!Number.isNaN(d.getTime())) dates.push(d);
  }

  // Excel serial-ish dates sometimes appear as 44927 — skip those.

  return dates;
}

function countDataRows(text: string): number {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("### Sheet:") &&
        !/^["']?date["']?/i.test(line),
    ).length;
}

/**
 * Reject huge / year-long statements before OpenAI burns tokens.
 * Uses date span when possible; falls back to row count.
 */
export function assertStatementWithinLimit(text: string): void {
  const rows = countDataRows(text);
  if (rows > MAX_STATEMENT_DATA_ROWS) {
    throw new StatementTooLargeError(
      `This file get too many rows (~${rows}). ${STATEMENT_RANGE_HINT}`,
    );
  }

  const dates = collectDates(text);
  if (dates.length < 6) return;

  dates.sort((a, b) => a.getTime() - b.getTime());
  // Ignore outlier header/footer dates; use the bulk of transaction dates.
  const lo = dates[Math.floor((dates.length - 1) * 0.1)]!;
  const hi = dates[Math.floor((dates.length - 1) * 0.9)]!;
  const spanMonths = monthsBetween(lo, hi);

  if (spanMonths > MAX_STATEMENT_MONTHS) {
    const from = lo.toISOString().slice(0, 10);
    const to = hi.toISOString().slice(0, 10);
    throw new StatementTooLargeError(
      `This statement span about ${spanMonths} months (${from} → ${to}). ${STATEMENT_RANGE_HINT}`,
    );
  }
}
