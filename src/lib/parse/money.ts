/** Parse bank-style amounts: "3,200.00", "₦803,875.80", "--", empty → number */
export function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const raw = String(value).trim();
  if (!raw || raw === "--" || raw === "-" || raw.toLowerCase() === "null") {
    return null;
  }

  const negative =
    raw.startsWith("(") && raw.endsWith(")") ||
    raw.startsWith("-");

  const cleaned = raw
    .replace(/[₦$€£,\s]/g, "")
    .replace(/[()]/g, "")
    .replace(/^-/, "");

  if (!cleaned || cleaned === ".") return null;

  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return negative ? -Math.abs(num) : num;
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86400000);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // "11 Jul 2026 08:38:32" / "11 Jul 2026"
  const match = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (match) {
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[match[2]];
    if (month === undefined) return null;
    return new Date(
      Number(match[3]),
      month,
      Number(match[1]),
      Number(match[4] ?? 0),
      Number(match[5] ?? 0),
      Number(match[6] ?? 0),
    );
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}
