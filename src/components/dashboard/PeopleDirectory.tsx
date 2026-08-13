"use client";

import { useMemo, useState } from "react";
import { useLedger } from "@/hooks/useLedger";
import { formatNaira, initials } from "@/lib/format";

const VISIBLE_ROWS = 10;
const ROW_HEIGHT_PX = 56;
const HEADER_HEIGHT_PX = 44;

export function PeopleDirectory() {
  const { insight, selectPerson } = useLedger();
  const [query, setQuery] = useState("");

  const people = useMemo(() => {
    const list = insight?.netBalances ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [insight?.netBalances, query]);

  const listMaxHeight = HEADER_HEIGHT_PX + VISIBLE_ROWS * ROW_HEIGHT_PX;

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-clip">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
            People
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Showing {Math.min(VISIBLE_ROWS, people.length)} of {people.length} — scroll
            for more. Tap anyone for details.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people…"
          className="w-full rounded-md border border-white/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/40 sm:w-72"
        />
      </div>

      {/* Mobile cards */}
      <div
        className="space-y-2 overflow-y-auto md:hidden"
        style={{ maxHeight: listMaxHeight + 40 }}
      >
        {people.length === 0 ? (
          <p className="rounded-xl border border-white/10 px-4 py-8 text-sm text-zinc-500">
            No people match that search.
          </p>
        ) : (
          people.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => selectPerson(p.name)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-left transition active:bg-white/[0.06]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[11px] text-zinc-200">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-100">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Out {formatNaira(p.sent, { compact: true })} · In{" "}
                  {formatNaira(p.received, { compact: true })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm text-white">
                  {p.net > 0 ? "+" : ""}
                  {formatNaira(p.net, { compact: true })}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {p.sentCount + p.receivedCount} txns
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div
        className="hidden overflow-auto rounded-xl border border-white/10 md:block"
        style={{ maxHeight: listMaxHeight }}
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0d0d0f]">
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3 font-medium">Person</th>
              <th className="px-3 py-3 font-medium">Sent</th>
              <th className="px-3 py-3 font-medium">Received</th>
              <th className="px-3 py-3 font-medium">Net</th>
              <th className="px-5 py-3 text-right font-medium">Txns</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-zinc-500">
                  No people match that search.
                </td>
              </tr>
            ) : (
              people.map((p) => (
                <tr
                  key={p.name}
                  className="h-14 cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.04]"
                  onClick={() => selectPerson(p.name)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[11px] text-zinc-200">
                        {initials(p.name)}
                      </span>
                      <span className="text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-zinc-300">{formatNaira(p.sent)}</td>
                  <td className="px-3 py-3 text-zinc-300">{formatNaira(p.received)}</td>
                  <td className="px-3 py-3 text-white">
                    {p.net > 0 ? "+" : ""}
                    {formatNaira(p.net)}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-500">
                    {p.sentCount + p.receivedCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
