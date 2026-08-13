"use client";

import { useLedger } from "@/hooks/useLedger";
import { formatDate, formatNaira } from "@/lib/format";

export function MetricsStrip() {
  const { insight, meta } = useLedger();
  if (!insight) return null;
  const { metrics } = insight;

  const items = [
    {
      label: "Transfer out",
      value: formatNaira(metrics.transferSent),
      hint: "Person-to-person sent",
    },
    {
      label: "Transfer in",
      value: formatNaira(metrics.transferReceived),
      hint: "Person-to-person received",
    },
    {
      label: "Counterparties",
      value: String(metrics.uniqueCounterparties),
      hint: `${metrics.transactionCount} rows parsed`,
    },
    {
      label: "Period",
      value:
        metrics.periodStart && metrics.periodEnd
          ? `${formatDate(metrics.periodStart)} – ${formatDate(metrics.periodEnd)}`
          : meta?.period ?? "—",
      hint: meta?.accountName ?? "Statement window",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="metric-enter min-w-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent px-3 py-3 sm:px-5 sm:py-4"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:text-[11px] sm:tracking-[0.18em]">
            {item.label}
          </p>
          <p className="mt-1.5 break-words font-[family-name:var(--font-display)] text-lg tracking-tight text-white sm:mt-2 sm:text-2xl">
            {item.value}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 sm:text-xs">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
