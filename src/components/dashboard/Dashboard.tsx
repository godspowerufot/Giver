"use client";

import { BiggestTransfer } from "@/components/dashboard/BiggestTransfer";
import { CelebrationCard } from "@/components/dashboard/CelebrationCard";
import {
  FlowSplitChart,
  TopRecipientsChart,
  TopSendersChart,
} from "@/components/dashboard/charts/OverviewCharts";
import { ThankYouCard } from "@/components/dashboard/ThankYouCard";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { NetBalances } from "@/components/dashboard/NetBalances";
import { PeopleDirectory } from "@/components/dashboard/PeopleDirectory";
import { Recommendations } from "@/components/dashboard/Recommendations";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { useLedger } from "@/hooks/useLedger";

function OverviewView() {
  const { setView } = useLedger();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-4xl">
            Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Charts first — tap a bar or row to open person details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView("people")}
          className="shrink-0 text-sm text-zinc-300 underline-offset-4 hover:text-white hover:underline"
        >
          Browse all people →
        </button>
      </div>

      <MetricsStrip />

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-0 xl:col-span-2">
          <TopRecipientsChart flushBottom />
          <TopSendersChart flushTop />
        </div>
        <div className="min-w-0 space-y-6">
          <BiggestTransfer />
          <CelebrationCard />
          <ThankYouCard />
        </div>
      </div>

      <FlowSplitChart />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Recommendations />
        <NetBalances />
      </div>
    </div>
  );
}

function InsightsView() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white">
          Insights
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Automatic caps and spread advice when outflow concentrates.
        </p>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Recommendations />
        <BiggestTransfer />
      </div>
      <TopRecipientsChart />
    </div>
  );
}

function TransactionsView() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Filter people transfers, sent, received, or every parsed row.
        </p>
      </div>
      <TransactionTable />
    </div>
  );
}

export function Dashboard() {
  const { status, insight, view } = useLedger();

  if (status !== "ready" || !insight) {
    return (
      <section className="flex min-h-[65dvh] w-full min-w-0 max-w-full flex-col justify-center overflow-x-clip">
        <div className="mb-8 max-w-xl sm:mb-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
            Check who you give the most.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:mt-4 sm:text-base">
            Upload a CSV wallet or bank statement — one file or several. Rank
            recipients and see where your money goes.
          </p>
        </div>
        <FileDropzone />
      </section>
    );
  }

  if (view === "people") return <PeopleDirectory />;
  if (view === "transactions") return <TransactionsView />;
  if (view === "insights") return <InsightsView />;
  return <OverviewView />;
}
