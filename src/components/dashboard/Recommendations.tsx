"use client";

import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useLedger } from "@/hooks/useLedger";

const tone: Record<string, string> = {
  info: "border-white/15 bg-white/[0.04] text-zinc-200",
  warn: "border-amber-300/25 bg-amber-400/10 text-amber-50",
  critical: "border-red-300/30 bg-red-500/10 text-red-50",
};

export function Recommendations() {
  const { insight, selectPerson } = useLedger();
  const recs = insight?.recommendations ?? [];

  return (
    <Panel>
      <PanelHeader
        title="Spend-down suggestions"
        subtitle="Automatic caps and spread advice when outflow concentrates"
      />
      <ul className="space-y-3 px-5 py-5">
        {recs.map((rec) => (
          <li
            key={rec.id}
            className={`rounded-lg border px-4 py-3 ${tone[rec.severity]} ${
              rec.person ? "cursor-pointer transition hover:brightness-110" : ""
            }`}
            onClick={() => {
              if (rec.person) selectPerson(rec.person);
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">
              {rec.severity}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-base tracking-tight">
              {rec.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed opacity-80">{rec.body}</p>
            {rec.person ? (
              <p className="mt-2 text-xs opacity-60">Open {rec.person} →</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
