import { readFileSync } from "fs";
import Papa from "papaparse";

const text = readFileSync("./public/samples/sample-statement.csv", "utf8");
const matrix = Papa.parse(text, { header: false }).data;

const headerIndex = matrix.findIndex((row) => {
  const joined = (row ?? []).map((c) => String(c ?? "").toLowerCase()).join(" | ");
  return joined.includes("description") && joined.includes("debit");
});

const headers = matrix[headerIndex].map((h, i) => String(h ?? "").trim() || `col_${i}`);
const idx = (name) => headers.findIndex((h) => h.toLowerCase().includes(name));
const descIdx = idx("description");
const debitIdx = idx("debit");
const creditIdx = idx("credit");

const parseAmt = (v) => {
  const s = String(v ?? "").trim();
  if (!s || s === "--") return 0;
  const n = Number(s.replace(/[₦,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const people = new Map();
let transferSent = 0;
let transferReceived = 0;
let biggest = null;

for (let i = headerIndex + 1; i < matrix.length; i++) {
  const row = matrix[i] ?? [];
  const desc = String(row[descIdx] ?? "").trim();
  const debit = parseAmt(row[debitIdx]);
  const credit = parseAmt(row[creditIdx]);
  const to = desc.match(/^Transfer to\s+(?:POS Transfer[-–]\s*)?(.+?)(?:\s*\||$)/i);
  const from = desc.match(/^Transfer from\s+(.+?)(?:\s*\||$)/i);
  if (to && debit > 0) {
    const name = to[1].replace(/\s+/g, " ").trim();
    const cur = people.get(name) || { sent: 0, received: 0 };
    cur.sent += debit;
    people.set(name, cur);
    transferSent += debit;
    if (!biggest || debit > biggest.amount) biggest = { name, amount: debit };
  }
  if (from && credit > 0) {
    const name = from[1].replace(/\s+/g, " ").trim();
    const cur = people.get(name) || { sent: 0, received: 0 };
    cur.received += credit;
    people.set(name, cur);
    transferReceived += credit;
  }
}

const recipients = [...people.entries()]
  .map(([name, v]) => ({ name, ...v, pct: +((v.sent / transferSent) * 100).toFixed(1) }))
  .filter((p) => p.sent > 0)
  .sort((a, b) => b.sent - a.sent);

const senders = [...people.entries()]
  .map(([name, v]) => ({ name, received: v.received }))
  .filter((p) => p.received > 0)
  .sort((a, b) => b.received - a.received);

console.log(
  JSON.stringify(
    {
      headerIndex,
      transferSent,
      transferReceived,
      people: people.size,
      topRecipients: recipients.slice(0, 5),
      topSenders: senders.slice(0, 5),
      biggest,
    },
    null,
    2,
  ),
);
