"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLedger } from "@/hooks/useLedger";
import { formatNaira } from "@/lib/format";

const tooltipStyle = {
  background: "#111113",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#e4e4e7",
  fontSize: 12,
};

const tooltipLabelStyle = {
  color: "#a1a1aa",
  marginBottom: 4,
};

const tooltipItemStyle = {
  color: "#d4d4d8",
};

function shortName(name: string, mobile: boolean) {
  const parts = name.trim().split(/\s+/);
  if (mobile) {
    if (parts.length === 1) return parts[0].slice(0, 10);
    return `${parts[0].slice(0, 8)} ${parts[parts.length - 1][0]}.`;
  }
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function RankBarChart({
  title,
  subtitle,
  mode,
  panelClassName,
}: {
  title: string;
  subtitle: string;
  mode: "sent" | "received";
  panelClassName?: string;
}) {
  const { insight, selectPerson, selectedPerson } = useLedger();
  const isMobile = useIsMobile();
  const source =
    mode === "sent" ? insight?.topRecipients ?? [] : insight?.topSenders ?? [];
  const data = source.slice(0, isMobile ? 6 : 8).map((p) => ({
    name: shortName(p.name, isMobile),
    fullName: p.name,
    amount: mode === "sent" ? p.sent : p.received,
  }));

  const activeFill = "#ffffff";
  const idleFill =
    mode === "sent" ? "rgba(255,255,255,0.55)" : "rgba(161,161,170,0.75)";

  return (
    <Panel className={panelClassName}>
      <PanelHeader title={title} subtitle={subtitle} />
      <div className="h-64 min-w-0 overflow-hidden px-2 py-4 sm:h-80 sm:px-6 sm:py-6">
        {data.length === 0 ? (
          <p className="px-3 py-10 text-sm text-zinc-500">
            {mode === "sent"
              ? "No outbound person transfers."
              : "No inbound person transfers."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              barCategoryGap={isMobile ? "22%" : "18%"}
              margin={{
                top: 8,
                right: isMobile ? 4 : 20,
                left: 0,
                bottom: 8,
              }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => formatNaira(Number(v), { compact: true })}
                tick={{ fill: "#71717a", fontSize: isMobile ? 10 : 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 64 : 110}
                tick={{ fill: "#d4d4d8", fontSize: isMobile ? 10 : 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value) => formatNaira(Number(value ?? 0))}
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.fullName ?? "")
                }
              />
              <Bar
                dataKey="amount"
                name={mode === "sent" ? "Sent" : "Received"}
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry) => {
                  const payload = entry as {
                    fullName?: string;
                    payload?: { fullName?: string };
                  };
                  const fullName = payload.payload?.fullName ?? payload.fullName;
                  if (fullName) selectPerson(fullName);
                }}
              >
                {data.map((d) => (
                  <Cell
                    key={d.fullName}
                    fill={
                      selectedPerson?.toUpperCase() === d.fullName.toUpperCase()
                        ? activeFill
                        : idleFill
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}

export function TopRecipientsChart({ flushBottom = false }: { flushBottom?: boolean }) {
  return (
    <RankBarChart
      title="Top recipients"
      subtitle="Tap a bar to open their detail panel"
      mode="sent"
      panelClassName={flushBottom ? "rounded-b-none border-b-0" : undefined}
    />
  );
}

export function TopSendersChart({ flushTop = false }: { flushTop?: boolean }) {
  return (
    <RankBarChart
      title="Top senders"
      subtitle="Who sends you the most — tap a bar for detail"
      mode="received"
      panelClassName={flushTop ? "rounded-t-none" : undefined}
    />
  );
}

export function FlowSplitChart() {
  const { insight } = useLedger();
  const isMobile = useIsMobile();
  if (!insight) return null;

  const data = [
    { name: "Transfer out", value: insight.metrics.transferSent },
    { name: "Transfer in", value: insight.metrics.transferReceived },
  ].filter((d) => d.value > 0);

  const colors = ["#ffffff", "#71717a"];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Panel>
      <PanelHeader
        title="Person transfer volume"
        subtitle="Outbound vs inbound person-to-person totals"
      />
      <div className="flex min-h-56 min-w-0 flex-col items-center gap-4 overflow-hidden px-4 py-5 sm:h-80 sm:flex-row sm:px-6 sm:py-6">
        {data.length === 0 ? (
          <p className="text-sm text-zinc-500">No person transfer volume yet.</p>
        ) : (
          <>
            <div className="h-52 w-full min-w-0 overflow-hidden sm:h-full sm:flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={isMobile ? 48 : 62}
                    outerRadius={isMobile ? 74 : 92}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {data.map((entry, i) => (
                      <Cell key={entry.name} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    formatter={(value) => formatNaira(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex w-full shrink-0 justify-center gap-6 text-sm sm:w-auto sm:flex-col sm:justify-start sm:gap-3 sm:space-y-0">
              {data.map((d, i) => (
                <li key={d.name}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: colors[i % colors.length] }}
                    />
                    <span className="text-zinc-400">{d.name}</span>
                  </div>
                  <p className="mt-1 pl-4 text-white">{formatNaira(d.value)}</p>
                  <p className="pl-4 text-[11px] text-zinc-500">
                    {total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : "0%"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
