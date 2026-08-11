import type { PersonAggregate, Transaction } from "@/lib/types";

export interface DayFlow {
  date: string;
  label: string;
  sent: number;
  received: number;
}

export interface PersonDetail {
  person: PersonAggregate;
  transactions: Transaction[];
  timeline: DayFlow[];
  avgSent: number;
  avgReceived: number;
  largestOut: Transaction | null;
  largestIn: Transaction | null;
}

function samePerson(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

export function getPersonDetail(
  name: string,
  people: PersonAggregate[],
  personTransfers: Transaction[],
): PersonDetail | null {
  const person =
    people.find((p) => samePerson(p.name, name)) ??
    null;
  if (!person) return null;

  const transactions = personTransfers
    .filter((tx) => tx.counterparty && samePerson(tx.counterparty, name))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const byDay = new Map<string, DayFlow>();
  for (const tx of [...transactions].reverse()) {
    if (!tx.date) continue;
    const key = tx.date.toISOString().slice(0, 10);
    const label = tx.date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const row = byDay.get(key) ?? { date: key, label, sent: 0, received: 0 };
    if (tx.direction === "sent") row.sent += tx.amount;
    if (tx.direction === "received") row.received += tx.amount;
    byDay.set(key, row);
  }

  const timeline = Array.from(byDay.values());
  const outs = transactions.filter((t) => t.direction === "sent");
  const ins = transactions.filter((t) => t.direction === "received");

  return {
    person,
    transactions,
    timeline,
    avgSent: outs.length ? person.sent / outs.length : 0,
    avgReceived: ins.length ? person.received / ins.length : 0,
    largestOut: outs.reduce<Transaction | null>(
      (best, tx) => (!best || tx.amount > best.amount ? tx : best),
      null,
    ),
    largestIn: ins.reduce<Transaction | null>(
      (best, tx) => (!best || tx.amount > best.amount ? tx : best),
      null,
    ),
  };
}
