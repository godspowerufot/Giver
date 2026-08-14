import { matchesGiverColumnMap } from "@/lib/parse/needsAiRestructuring";
import type { ParseResult } from "@/lib/parse/parseFile";

/**
 * OPay / similar wallet exports we can parse locally without OpenAI.
 * Typical columns: date, recipient, amount, type, description, transaction_id.
 */
export function isOpayStructure(result: ParseResult): boolean {
  const fileName = (result.meta.fileName ?? "").toLowerCase();
  // OPay exports often look like: Name_9058386152_20260814025819.xlsx
  if (
    /opay|palmpay|moniepoint|kuda|fairmoney/.test(fileName) ||
    /_\d{10,13}_\d{10,}/.test(fileName)
  ) {
    return matchesGiverColumnMap(result.columnMap) || result.transactions.length > 0;
  }

  const map = result.columnMap;
  if (!map || !matchesGiverColumnMap(map)) return false;

  // Classic wallet shape: amount + type/direction (+ recipient).
  if (map.mode === "direction_column" && map.amount && map.direction) {
    if (map.counterparty) return true;

    const sample = result.transactions
      .slice(0, 25)
      .map((tx) => `${tx.description} ${Object.values(tx.raw).join(" ")}`)
      .join(" ")
      .toLowerCase();

    if (
      /opay|palmpay|moniepoint|transfer to|transfer from|money transferred|received from|sent to/.test(
        sample,
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Local parse is good enough — skip OpenAI.
 * Prefer any well-mapped sheet with usable money rows.
 */
export function canUseLocalStructure(result: ParseResult): boolean {
  if (!result.transactions.length) return false;
  if (!matchesGiverColumnMap(result.columnMap)) return false;

  if (isOpayStructure(result)) return true;

  const unknownShare =
    result.transactions.filter((tx) => tx.direction === "unknown").length /
    result.transactions.length;
  return unknownShare <= 0.4;
}
