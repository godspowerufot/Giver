import { matchesGiverColumnMap } from "@/lib/parse/needsAiRestructuring";
import type { ParseResult } from "@/lib/parse/parseFile";

/**
 * True when the sheet matches OPay / wallet export layout.
 * Those files use local parse only — no OpenAI.
 */
export function isOpayStructure(result: ParseResult): boolean {
  if (!result.transactions.length) return false;

  const fileName = (result.meta.fileName ?? "").toLowerCase();
  // OPay app exports often look like: Name_9058386152_20260814025819.xlsx
  const looksLikeWalletFile =
    /opay|palmpay|moniepoint|kuda|fairmoney/.test(fileName) ||
    /_\d{10,13}_\d{10,}/.test(fileName);

  const map = result.columnMap;
  if (!map) return false;

  // Classic OPay columns: amount + type/direction (+ description).
  const classicWallet =
    map.mode === "direction_column" &&
    Boolean(map.amount && map.direction && map.description);

  if (classicWallet) {
    if (map.counterparty || looksLikeWalletFile) return true;

    const sample = result.transactions
      .slice(0, 30)
      .map((tx) => `${tx.description} ${Object.values(tx.raw).join(" ")}`)
      .join(" ")
      .toLowerCase();

    if (
      /opay|palmpay|moniepoint|transfer to|transfer from|money transferred|received from|sent to|wallet/.test(
        sample,
      )
    ) {
      return true;
    }
  }

  // Named wallet file with any solid Giver column map.
  if (looksLikeWalletFile && matchesGiverColumnMap(map)) {
    return true;
  }

  return false;
}

/** Use local parse (skip OpenAI) only for OPay / wallet structure. */
export function canUseLocalStructure(result: ParseResult): boolean {
  return isOpayStructure(result);
}
