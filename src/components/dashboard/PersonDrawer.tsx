"use client";

import { useEffect, useMemo } from "react";
import {
  PersonBarChart,
  PersonFlowChart,
  PersonSplitChart,
} from "@/components/dashboard/charts/PersonCharts";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useLedger } from "@/hooks/useLedger";
import { getPersonDetail } from "@/lib/analytics/personDetail";
import { formatDateTime, formatNaira, initials } from "@/lib/format";

export function PersonDrawer() {
  const { selectedPerson, insight, clearPerson } = useLedger();
  const open = Boolean(selectedPerson);

  const detail = useMemo(() => {
    if (!selectedPerson || !insight) return null;
    return getPersonDetail(
      selectedPerson,
      insight.netBalances,
      insight.personTransfers,
    );
  }, [selectedPerson, insight]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearPerson();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, clearPerson]);

  return (
    <>
      <button
        type="button"
        aria-label="Close person panel"
        onClick={clearPerson}
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={selectedPerson ? `Details for ${selectedPerson}` : "Person details"}
        className={`fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-[#0b0b0d] shadow-[0_-24px_80px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-w-xl sm:rounded-none sm:border-l sm:border-t-0 sm:shadow-[-24px_0_80px_rgba(0,0,0,0.55)] lg:max-w-2xl ${
          open ? "translate-y-0 sm:translate-x-0 sm:translate-y-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
        }`}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:py-4 sm:pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Person detail
          </p>
          <button
            type="button"
            onClick={clearPerson}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-white/40 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5">
          {!detail ? (
            <p className="py-10 text-sm text-zinc-500">Person not found in this statement.</p>
          ) : (
            <PersonDrawerBody detail={detail} />
          )}
        </div>
      </aside>
    </>
  );
}

function PersonDrawerBody({
  detail,
}: {
  detail: NonNullable<ReturnType<typeof getPersonDetail>>;
}) {
  const { person, transactions, timeline, avgSent, avgReceived, largestOut, largestIn } =
    detail;

  const stats = [
    { label: "Sent", value: formatNaira(person.sent), sub: `${person.sentCount} txns` },
    {
      label: "Received",
      value: formatNaira(person.received),
      sub: `${person.receivedCount} txns`,
    },
    {
      label: "Net",
      value: `${person.net > 0 ? "+" : ""}${formatNaira(person.net)}`,
      sub: person.net >= 0 ? "You gave more" : "They gave more",
    },
    {
      label: "Avg send",
      value: formatNaira(avgSent),
      sub: avgReceived ? `Avg in ${formatNaira(avgReceived)}` : "No inbound",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-[family-name:var(--font-display)] text-sm text-white">
          {initials(person.name)}
        </div>
        <div className="min-w-0">
          <h2 className="break-words font-[family-name:var(--font-display)] text-xl tracking-tight text-white sm:text-2xl">
            {person.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {transactions.length} transfer{transactions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{s.label}</p>
            <p className="mt-1 break-all font-[family-name:var(--font-display)] text-base text-white sm:text-lg">
              {s.value}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <PersonFlowChart timeline={timeline} />
      <div className="grid gap-5 sm:grid-cols-2">
        <PersonSplitChart sent={person.sent} received={person.received} />
        <PersonBarChart timeline={timeline} />
      </div>

      {(largestOut || largestIn) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {largestOut ? (
            <div className="rounded-lg border border-white/10 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Largest sent
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-white">
                {formatNaira(largestOut.amount)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {formatDateTime(largestOut.date)}
              </p>
            </div>
          ) : null}
          {largestIn ? (
            <div className="rounded-lg border border-white/10 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Largest received
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-white">
                {formatNaira(largestIn.amount)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {formatDateTime(largestIn.date)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <Panel>
        <PanelHeader
          title="Transactions"
          subtitle={`${transactions.length} transfers · amount & direction`}
        />
        <ul className="divide-y divide-white/5">
          {transactions.length === 0 ? (
            <li className="px-5 py-8 text-sm text-zinc-500">No transfers.</li>
          ) : (
            transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-start justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        tx.direction === "sent"
                          ? "border-white/25 text-white"
                          : "border-zinc-500 text-zinc-300"
                      }`}
                    >
                      {tx.direction}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDateTime(tx.date)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {tx.bank ?? tx.description}
                  </p>
                </div>
                <p className="shrink-0 font-[family-name:var(--font-display)] text-base text-white">
                  {formatNaira(tx.amount)}
                </p>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </div>
  );
}
