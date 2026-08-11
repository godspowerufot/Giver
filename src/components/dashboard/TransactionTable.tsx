"use client";

import { useMemo, useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useLedger } from "@/hooks/useLedger";
import { formatDateTime, formatNaira } from "@/lib/format";

type Filter = "people" | "all" | "sent" | "received";

export function TransactionTable() {
  const { transactions, insight, selectPerson } = useLedger();
  const [filter, setFilter] = useState<Filter>("people");

  const rows = useMemo(() => {
    const base =
      filter === "people"
        ? insight?.personTransfers ?? []
        : filter === "sent"
          ? transactions.filter((t) => t.direction === "sent")
          : filter === "received"
            ? transactions.filter((t) => t.direction === "received")
            : transactions;

    return [...base]
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, 40);
  }, [filter, insight?.personTransfers, transactions]);

  const filters: { id: Filter; label: string }[] = [
    { id: "people", label: "People" },
    { id: "sent", label: "Sent" },
    { id: "received", label: "Received" },
    { id: "all", label: "All rows" },
  ];

  const filterBar = (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => (
        <Button
          key={f.id}
          variant={filter === f.id ? "primary" : "ghost"}
          className="!px-3 !py-1.5 text-xs"
          onClick={() => setFilter(f.id)}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );

  return (
    <Panel>
      <PanelHeader
        title="Transactions"
        subtitle="Recent activity from your local parse"
        action={filterBar}
      />

      {/* Mobile cards */}
      <ul className="divide-y divide-white/5 md:hidden">
        {rows.map((tx) => (
          <li key={tx.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {tx.counterparty ? (
                  <button
                    type="button"
                    onClick={() => selectPerson(tx.counterparty!)}
                    className="truncate text-left text-sm text-white hover:underline"
                  >
                    {tx.counterparty}
                  </button>
                ) : (
                  <p className="truncate text-sm text-zinc-400">—</p>
                )}
                <p className="mt-1 text-[11px] text-zinc-500">
                  {formatDateTime(tx.date)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm text-white">{formatNaira(tx.amount)}</p>
                <span
                  className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                    tx.direction === "sent"
                      ? "border-white/20 text-white"
                      : tx.direction === "received"
                        ? "border-zinc-500 text-zinc-300"
                        : "border-zinc-700 text-zinc-500"
                  }`}
                >
                  {tx.direction}
                </span>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{tx.description}</p>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-3 py-3 font-medium">Counterparty</th>
              <th className="px-3 py-3 font-medium">Direction</th>
              <th className="px-3 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.id} className="border-b border-white/5 last:border-0">
                <td className="whitespace-nowrap px-5 py-3 text-zinc-400">
                  {formatDateTime(tx.date)}
                </td>
                <td className="max-w-[180px] truncate px-3 py-3 text-zinc-100">
                  {tx.counterparty ? (
                    <button
                      type="button"
                      onClick={() => selectPerson(tx.counterparty!)}
                      className="truncate text-left hover:underline"
                    >
                      {tx.counterparty}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider ${
                      tx.direction === "sent"
                        ? "border-white/20 text-white"
                        : tx.direction === "received"
                          ? "border-zinc-500 text-zinc-300"
                          : "border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {tx.direction}
                  </span>
                </td>
                <td className="max-w-[280px] truncate px-3 py-3 text-zinc-500">
                  {tx.description}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-zinc-100">
                  {formatNaira(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
