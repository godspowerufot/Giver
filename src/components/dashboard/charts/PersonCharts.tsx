"use client";

import {
  Area,
  AreaChart,
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
import type { DayFlow } from "@/lib/analytics/personDetail";
import { formatNaira } from "@/lib/format";
import { Panel, PanelHeader } from "@/components/ui/Panel";

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

function moneyTick(value: number) {
  return formatNaira(value, { compact: true });
}

export function PersonFlowChart({ timeline }: { timeline: DayFlow[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Flow over time"
        subtitle="Sent and received by day"
      />
      <div className="h-52 min-w-0 overflow-hidden px-1 py-3 sm:h-64 sm:px-4 sm:py-4">
        {timeline.length === 0 ? (
          <p className="px-3 py-10 text-sm text-zinc-500">No dated transfers to chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recvFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a1a1aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={moneyTick}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value) => formatNaira(Number(value ?? 0))}
              />
              <Area
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke="#ffffff"
                fill="url(#sentFill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="#a1a1aa"
                fill="url(#recvFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}

export function PersonSplitChart({
  sent,
  received,
}: {
  sent: number;
  received: number;
}) {
  const data = [
    { name: "Sent", value: sent },
    { name: "Received", value: received },
  ].filter((d) => d.value > 0);

  const colors = ["#ffffff", "#71717a"];

  return (
    <Panel>
      <PanelHeader title="Sent vs received" subtitle="Share of total flow with this person" />
      <div className="flex h-52 min-w-0 flex-col items-center gap-3 overflow-hidden px-3 py-3 sm:h-64 sm:flex-row sm:gap-2 sm:px-4 sm:py-4">
        {data.length === 0 ? (
          <p className="text-sm text-zinc-500">No amounts to compare.</p>
        ) : (
          <>
            <div className="h-40 w-full min-w-0 overflow-hidden sm:h-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={62}
                    paddingAngle={3}
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
            <ul className="flex w-full justify-center gap-4 text-sm sm:w-auto sm:flex-col sm:justify-start sm:space-y-3 sm:gap-0">
              {data.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="text-zinc-400">{d.name}</span>
                  <span className="text-white">{formatNaira(d.value)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}

export function PersonBarChart({ timeline }: { timeline: DayFlow[] }) {
  const topDays = [...timeline]
    .sort((a, b) => b.sent + b.received - (a.sent + a.received))
    .slice(0, 8)
    .reverse();

  return (
    <Panel>
      <PanelHeader title="Busiest days" subtitle="Highest combined volume" />
      <div className="h-52 min-w-0 overflow-hidden px-1 py-3 sm:h-64 sm:px-4 sm:py-4">
        {topDays.length === 0 ? (
          <p className="px-3 py-10 text-sm text-zinc-500">No activity days yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDays} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={moneyTick}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value) => formatNaira(Number(value ?? 0))}
              />
              <Bar dataKey="sent" name="Sent" fill="#ffffff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" name="Received" fill="#52525b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
