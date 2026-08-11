import type {
  LedgerInsight,
  LedgerMetrics,
  PersonAggregate,
  Transaction,
} from "@/lib/types";
import { buildRecommendations } from "./recommendations";

function isPersonTransfer(tx: Transaction): boolean {
  return tx.kind === "transfer" && Boolean(tx.counterparty);
}

export function computeLedger(transactions: Transaction[]): LedgerInsight {
  const personTransfers = transactions.filter(isPersonTransfer);

  const byPerson = new Map<string, PersonAggregate>();

  const ensure = (name: string): PersonAggregate => {
    const key = name.toUpperCase();
    let row = byPerson.get(key);
    if (!row) {
      row = {
        name,
        sent: 0,
        received: 0,
        net: 0,
        sentCount: 0,
        receivedCount: 0,
        shareOfSent: 0,
        shareOfReceived: 0,
      };
      byPerson.set(key, row);
    }
    return row;
  };

  let transferSent = 0;
  let transferReceived = 0;
  let totalSent = 0;
  let totalReceived = 0;
  let biggest: Transaction | null = null;

  for (const tx of transactions) {
    if (tx.direction === "sent") totalSent += tx.amount;
    if (tx.direction === "received") totalReceived += tx.amount;
  }

  for (const tx of personTransfers) {
    const person = ensure(tx.counterparty!);
    if (tx.direction === "sent") {
      person.sent += tx.amount;
      person.sentCount += 1;
      transferSent += tx.amount;
      if (!biggest || tx.amount > biggest.amount) biggest = tx;
    }
    if (tx.direction === "received") {
      person.received += tx.amount;
      person.receivedCount += 1;
      transferReceived += tx.amount;
    }
  }

  const people = Array.from(byPerson.values()).map((p) => ({
    ...p,
    net: p.sent - p.received,
    shareOfSent: transferSent > 0 ? p.sent / transferSent : 0,
    shareOfReceived: transferReceived > 0 ? p.received / transferReceived : 0,
  }));

  const topRecipients = [...people]
    .filter((p) => p.sent > 0)
    .sort((a, b) => b.sent - a.sent);

  const topSenders = [...people]
    .filter((p) => p.received > 0)
    .sort((a, b) => b.received - a.received);

  const netBalances = [...people]
    .filter((p) => p.sent > 0 || p.received > 0)
    .sort((a, b) => b.net - a.net);

  const dates = transactions
    .map((t) => t.date)
    .filter((d): d is Date => Boolean(d && !Number.isNaN(d.getTime())))
    .sort((a, b) => a.getTime() - b.getTime());

  const metrics: LedgerMetrics = {
    totalSent,
    totalReceived,
    transferSent,
    transferReceived,
    transactionCount: transactions.length,
    uniqueCounterparties: people.length,
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
    biggestTransfer: biggest,
  };

  return {
    metrics,
    topRecipients,
    topSenders,
    netBalances,
    recommendations: buildRecommendations(topRecipients, transferSent),
    personTransfers,
  };
}
