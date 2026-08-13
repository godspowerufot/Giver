export type Direction = "sent" | "received" | "unknown";

export type TransactionKind =
  | "transfer"
  | "internal"
  | "fee"
  | "bill"
  | "other";

export interface Transaction {
  id: string;
  date: Date | null;
  description: string;
  amount: number;
  direction: Direction;
  counterparty: string | null;
  bank: string | null;
  account: string | null;
  channel: string | null;
  reference: string | null;
  balanceAfter: number | null;
  kind: TransactionKind;
  raw: Record<string, string>;
}

export interface PersonAggregate {
  name: string;
  sent: number;
  received: number;
  net: number;
  sentCount: number;
  receivedCount: number;
  shareOfSent: number;
  shareOfReceived: number;
}

export interface Recommendation {
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  body: string;
  person?: string;
}

export interface LedgerMetrics {
  totalSent: number;
  totalReceived: number;
  transferSent: number;
  transferReceived: number;
  transactionCount: number;
  uniqueCounterparties: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  biggestTransfer: Transaction | null;
}

export interface LedgerInsight {
  metrics: LedgerMetrics;
  topRecipients: PersonAggregate[];
  topSenders: PersonAggregate[];
  netBalances: PersonAggregate[];
  recommendations: Recommendation[];
  personTransfers: Transaction[];
}

export interface StatementMeta {
  accountName?: string;
  accountNumber?: string;
  period?: string;
  fileName: string;
  /** Present when multiple statements were merged in one session. */
  fileNames?: string[];
  sheetName?: string;
  detectedMode:
    | "debit_credit"
    | "signed_amount"
    | "direction_column"
    | "inferred"
    | "ai_structured";
}

export type ParseProgressStage =
  | "reading"
  | "checking"
  | "structuring"
  | "ranking"
  | "done";

export interface ParseProgress {
  percent: number;
  label: string;
  stage: ParseProgressStage;
  detail?: string;
}

export interface LedgerState {
  status: "idle" | "parsing" | "ready" | "error";
  error: string | null;
  meta: StatementMeta | null;
  transactions: Transaction[];
  insight: LedgerInsight | null;
  parseProgress: ParseProgress | null;
}
