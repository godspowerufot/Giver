"use client";

import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useLedger } from "@/hooks/useLedger";
import { formatNaira, initials } from "@/lib/format";

const VISIBLE_ROWS = 6;
const ROW_HEIGHT_PX = 52;
const HEADER_HEIGHT_PX = 44;

export function NetBalances() {
  const { insight, selectPerson } = useLedger();
  const rows = insight?.netBalances ?? [];
  const listMaxHeight = HEADER_HEIGHT_PX + VISIBLE_ROWS * ROW_HEIGHT_PX;

  return (
    <Panel>
      <PanelHeader
        title="Net balance by person"
        subtitle={`Showing ${Math.min(VISIBLE_ROWS, rows.length)} of ${rows.length} — scroll for more`}
      />

      {/* Mobile cards */}
      <div
        className="space-y-2 overflow-y-auto px-3 py-3 md:hidden"
        style={{ maxHeight: listMaxHeight + 24 }}
      >
        {rows.length === 0 ? (
          <p className="px-2 py-6 text-sm text-zinc-500">No person balances yet.</p>
        ) : (
          rows.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => selectPerson(p.name)}
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-left transition active:bg-white/[0.05]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-zinc-300">
                {initials(p.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-100">{p.name}</p>
                <p className="text-[11px] text-zinc-500">
                  {formatNaira(p.sent, { compact: true })} out ·{" "}
                  {formatNaira(p.received, { compact: true })} in
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-medium ${
                  p.net > 0 ? "text-white" : p.net < 0 ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {p.net > 0 ? "+" : ""}
                {formatNaira(p.net, { compact: true })}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-auto md:block" style={{ maxHeight: listMaxHeight }}>
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0d0d0f]">
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              <th className="px-5 py-3 font-medium">Person</th>
              <th className="px-3 py-3 font-medium">Sent</th>
              <th className="px-3 py-3 font-medium">Received</th>
              <th className="px-5 py-3 font-medium text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-zinc-500">
                  No person balances yet.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.name}
                  className="h-[52px] cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.04]"
                  onClick={() => selectPerson(p.name)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-zinc-300">
                        {initials(p.name)}
                      </span>
                      <span className="truncate text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-zinc-400">{formatNaira(p.sent)}</td>
                  <td className="px-3 py-3 text-zinc-400">{formatNaira(p.received)}</td>
                  <td
                    className={`px-5 py-3 text-right font-medium ${
                      p.net > 0 ? "text-white" : p.net < 0 ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {p.net > 0 ? "+" : ""}
                    {formatNaira(p.net)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
