import type { ParseResult } from "@/lib/parse/parseFile";
import type { StatementMeta, Transaction } from "@/lib/types";

type ApiTransaction = Omit<Transaction, "date"> & { date: string | null };

type ApiResponse = {
  transactions?: ApiTransaction[];
  meta?: StatementMeta;
  error?: string;
};

/** Send a statement to the server for Gemini → Transaction[] structuring. */
export async function structureStatementViaApi(file: File): Promise<ParseResult> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await fetch("/api/structure-statement", {
    method: "POST",
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as ApiResponse;
  if (!res.ok) {
    throw new Error(data.error || "Failed to structure statement with Gemini.");
  }

  if (!data.transactions || !data.meta) {
    throw new Error("AI structuring returned an incomplete payload.");
  }

  return {
    meta: data.meta,
    transactions: data.transactions.map((tx) => ({
      ...tx,
      date: tx.date ? new Date(tx.date) : null,
    })),
  };
}
