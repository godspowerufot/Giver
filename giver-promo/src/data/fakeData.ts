export const recipients = [
  { name: "Ada Okonkwo", short: "Ada O.", amount: 198000, pct: 0.22 },
  { name: "Tunde Adebayo", short: "Tunde A.", amount: 142500, pct: 0.16 },
  { name: "Chioma Eze", short: "Chioma E.", amount: 118000, pct: 0.13 },
  { name: "Ibrahim Musa", short: "Ibrahim M.", amount: 96500, pct: 0.11 },
  { name: "Ngozi Bello", short: "Ngozi B.", amount: 82000, pct: 0.09 },
];

export const senders = [
  { name: "Blocverse Ltd", short: "Blocverse", amount: 214900, pct: 0.38 },
  { name: "Azza", short: "Azza", amount: 52900, pct: 0.09 },
  { name: "Kemi Lawal", short: "Kemi L.", amount: 35000, pct: 0.06 },
  { name: "Jobmingle", short: "Jobmingle", amount: 20000, pct: 0.04 },
];

export const metrics = {
  transferOut: "₦242,628",
  transferIn: "₦385,228",
  people: "62",
  period: "11 Jul – 09 Aug",
};

export const topRecipient = recipients[0]!;
export const topSender = senders[0]!;

export const personTxns = [
  { dir: "sent" as const, when: "08 Aug · 14:22", amount: "₦15,300", note: "OPay" },
  { dir: "sent" as const, when: "02 Aug · 09:11", amount: "₦8,000", note: "UBA" },
  { dir: "received" as const, when: "28 Jul · 18:04", amount: "₦3,500", note: "Refund" },
  { dir: "sent" as const, when: "19 Jul · 12:40", amount: "₦12,000", note: "OPay" },
];

export const celebrationLine =
  "My wallet filed a missing-person report and listed your name as the last known location.";

export const thankYouLine =
  "Thank you. My account balance smiles every time your name shows up as a credit.";
