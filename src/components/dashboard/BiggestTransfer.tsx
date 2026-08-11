"use client";

import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useLedger } from "@/hooks/useLedger";
import { formatDateTime, formatNaira, initials } from "@/lib/format";

export function BiggestTransfer() {
  const { insight, selectPerson } = useLedger();
  const tx = insight?.metrics.biggestTransfer;
  if (!tx) {
    return (
      <Panel>
        <PanelHeader
          title="Biggest single transfer"
          subtitle="Largest person payment in this statement"
        />
        <p className="px-5 py-8 text-sm text-zinc-500">No outbound transfers detected.</p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Biggest single transfer"
        subtitle="Largest person payment — click to open profile"
      />
      <button
        type="button"
        onClick={() => {
          if (tx.counterparty) selectPerson(tx.counterparty);
        }}
        className="relative w-full px-5 py-6 text-left transition hover:bg-white/[0.03]"
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-[family-name:var(--font-display)] text-sm text-white">
            {initials(tx.counterparty ?? "?")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-display)] text-xl text-white">
              {tx.counterparty}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {formatDateTime(tx.date)}
              {tx.bank ? ` · ${tx.bank}` : ""}
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-tight text-white">
              {formatNaira(tx.amount)}
            </p>
          </div>
        </div>
      </button>
    </Panel>
  );
}
