import { matchesGiverColumnMap } from "@/lib/parse/needsAiRestructuring";
import type { ParseResult } from "@/lib/parse/parseFile";

/**
 * OPay / similar wallet exports we can parse locally without OpenAI.
 * Typical columns: date, recipient, amount, type, description, transaction_id.
 */
export function isOpayStructure(result: ParseResult): boolean {
  const fileName = (result.meta.fileName ?? "").toLowerCase();
  if (fileName.includes("opay")) return true;

  const map = result.columnMap;
  if (!map || !matchesGiverColumnMap(map)) return false;

  // Classic OPay wallet shape: amount + type/direction (+ recipient).
  if (map.mode === "direction_column" && map.amount && map.direction) {
    if (map.counterparty) return true;

    const sample = result.transactions
      .slice(0, 25)
      .map((tx) => `${tx.description} ${Object.values(tx.raw).join(" ")}`)
      .join(" ")
      .toLowerCase();

    if (
      /opay|transfer to|transfer from|money transferred|received from|sent to/.test(
        sample,
      )
    ) {
      return true;
    }
  }

  return false;
}

/** Local parse is good enough — skip OpenAI. */
export function canUseLocalStructure(result: ParseResult): boolean {
  if (!result.transactions.length) return false;
  if (!isOpayStructure(result)) return false;
  return matchesGiverColumnMap(result.columnMap);
}
