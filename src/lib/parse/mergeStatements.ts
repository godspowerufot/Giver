import type { ParseResult } from "@/lib/parse/parseFile";
import type { StatementMeta, Transaction } from "@/lib/types";

function fingerprint(tx: Transaction): string {
  const date = tx.date ? tx.date.toISOString().slice(0, 10) : "";
  const ref = (tx.reference ?? "").trim().toLowerCase();
  const desc = tx.description.trim().toLowerCase().replace(/\s+/g, " ");
  return [date, tx.direction, tx.amount.toFixed(2), ref || desc].join("|");
}

export function tagSourceFile(
  transactions: Transaction[],
  fileName: string,
): Transaction[] {
  return transactions.map((tx, index) => ({
    ...tx,
    id: `${fileName}-${index}-${tx.id}`,
    raw: {
      ...tx.raw,
      sourceFile: fileName,
    },
  }));
}

export function dedupeTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  const out: Transaction[] = [];
  for (const tx of transactions) {
    const key = fingerprint(tx);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tx);
  }
  return out;
}

function collectFileNames(
  meta: StatementMeta | null | undefined,
  transactions: Transaction[],
): string[] {
  if (meta?.fileNames?.length) return meta.fileNames;
  if (meta?.fileName && !meta.fileName.includes(" more")) return [meta.fileName];
  const fromTx = [
    ...new Set(
      transactions
        .map((tx) => tx.raw.sourceFile)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  return fromTx;
}

function buildMeta(
  fileNames: string[],
  results: Array<{ meta: StatementMeta }>,
): StatementMeta {
  const accountName = results.find((r) => r.meta.accountName)?.meta.accountName;
  const accountNumber = results.find((r) => r.meta.accountNumber)?.meta
    .accountNumber;
  const periods = results
    .map((r) => r.meta.period)
    .filter((p): p is string => Boolean(p));
  const modes = results.map((r) => r.meta.detectedMode);
  const detectedMode =
    modes.length && modes.every((m) => m === modes[0]) ? modes[0] : "inferred";

  return {
    accountName,
    accountNumber,
    period:
      periods.length === 0
        ? undefined
        : periods.length === 1
          ? periods[0]
          : `${periods.length} periods merged`,
    fileName:
      fileNames.length <= 1
        ? fileNames[0] ?? "Statement"
        : `${fileNames[0]} + ${fileNames.length - 1} more`,
    fileNames,
    detectedMode,
  };
}

/** Merge one or more parse results into a single ledger payload. */
export function mergeParseResults(results: ParseResult[]): ParseResult {
  if (!results.length) throw new Error("No statements to merge.");

  const tagged = results.flatMap((result) =>
    tagSourceFile(result.transactions, result.meta.fileName),
  );
  const fileNames = results.map((r) => r.meta.fileName);

  return {
    transactions: dedupeTransactions(tagged),
    meta: buildMeta(fileNames, results),
  };
}

/** Append freshly parsed statements onto an existing in-session ledger. */
export function appendParseResults(
  existing: Transaction[],
  existingMeta: StatementMeta | null,
  incoming: ParseResult[],
): ParseResult {
  if (!incoming.length) {
    return {
      transactions: existing,
      meta:
        existingMeta ??
        buildMeta(collectFileNames(null, existing), [
          { meta: { fileName: "session", detectedMode: "inferred" } },
        ]),
    };
  }

  const priorNames = collectFileNames(existingMeta, existing);
  const fresh = mergeParseResults(incoming);
  const nextNames = [...priorNames];
  for (const name of fresh.meta.fileNames ?? [fresh.meta.fileName]) {
    if (!nextNames.includes(name)) nextNames.push(name);
  }

  return {
    transactions: dedupeTransactions([...existing, ...fresh.transactions]),
    meta: buildMeta(nextNames, [
      ...(existingMeta ? [{ meta: existingMeta }] : []),
      ...incoming.map((r) => ({ meta: r.meta })),
    ]),
  };
}
