import type { ColumnMap } from "@/lib/parse/detectColumns";
import type { ParseResult } from "@/lib/parse/parseFile";

/**
 * Strict Giver layout: description + money columns we can trust.
 * A lone "Amount" / "Value" column is NOT enough — that falsely skips OpenAI.
 */
export function matchesGiverColumnMap(map: ColumnMap | undefined): boolean {
  if (!map?.description) return false;

  if (map.mode === "debit_credit") {
    return Boolean(map.debit && map.credit);
  }

  if (map.mode === "direction_column") {
    // Date helps but OPay-like sheets with amount+type+description are enough.
    return Boolean(map.amount && map.direction);
  }

  if (map.mode === "signed_amount") {
    return Boolean(map.amount && map.date);
  }

  return false;
}

/**
 * True when local parse is too weak and OpenAI should rewrite the file.
 * Do NOT send OPay/local-good sheets to OpenAI.
 */
export function needsAiRestructuring(result: ParseResult): boolean {
  const { transactions, columnMap, sourceRowCount } = result;

  if (!transactions.length) return true;

  if (!matchesGiverColumnMap(columnMap)) return true;

  // Local kept almost nothing from the sheet → wrong columns.
  if (
    typeof sourceRowCount === "number" &&
    sourceRowCount >= 8 &&
    transactions.length / sourceRowCount < 0.15
  ) {
    return true;
  }

  const unknownShare =
    transactions.filter((tx) => tx.direction === "unknown").length /
    transactions.length;
  if (unknownShare > 0.55) return true;

  const undatedShare =
    transactions.filter((tx) => !tx.date).length / transactions.length;
  if (undatedShare > 0.75) return true;

  return false;
}
