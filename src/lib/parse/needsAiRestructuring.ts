import type { ColumnMap } from "@/lib/parse/detectColumns";
import type { ParseResult } from "@/lib/parse/parseFile";

/**
 * Strict Giver layout: description + money columns we can trust.
 * A lone "Amount" / "Value" column is NOT enough — that falsely skips Gemini.
 */
export function matchesGiverColumnMap(map: ColumnMap | undefined): boolean {
  if (!map?.description) return false;

  if (map.mode === "debit_credit") {
    return Boolean(map.debit && map.credit);
  }

  if (map.mode === "direction_column") {
    return Boolean(map.amount && map.direction && map.date);
  }

  if (map.mode === "signed_amount") {
    // Require date so random "amount" CSVs don't count as matched.
    return Boolean(map.amount && map.date);
  }

  return false;
}

/**
 * True when local parse should be discarded and Gemini rewrite the file
 * into Giver's Transaction[] shape.
 */
export function needsAiRestructuring(result: ParseResult): boolean {
  const { transactions, meta, columnMap, sourceRowCount } = result;

  if (!transactions.length) return true;

  if (!matchesGiverColumnMap(columnMap)) return true;

  if (meta.detectedMode === "inferred") return true;

  // Local parse kept almost nothing from the sheet → wrong columns.
  if (
    typeof sourceRowCount === "number" &&
    sourceRowCount >= 5 &&
    transactions.length / sourceRowCount < 0.35
  ) {
    return true;
  }

  const unknownShare =
    transactions.filter((tx) => tx.direction === "unknown").length /
    transactions.length;
  if (unknownShare > 0.35) return true;

  const undatedShare =
    transactions.filter((tx) => !tx.date).length / transactions.length;
  if (undatedShare > 0.5) return true;

  return false;
}
