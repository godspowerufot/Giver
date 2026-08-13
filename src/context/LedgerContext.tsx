"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { computeLedger } from "@/lib/analytics/computeLedger";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import {
  appendParseResults,
  mergeParseResults,
} from "@/lib/parse/mergeStatements";
import { canUseLocalStructure } from "@/lib/parse/isOpayStructure";
import { needsAiRestructuring } from "@/lib/parse/needsAiRestructuring";
import { isStatementFile, parseLedgerFile } from "@/lib/parse/parseFile";
import { structureStatementViaApi } from "@/lib/parse/structureClient";
import type { ParseResult } from "@/lib/parse/parseFile";
import type { LedgerState, ParseProgress } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

type ProgressFn = (patch: Partial<ParseProgress> & Pick<ParseProgress, "label" | "stage">) => void;

function startProgressTicker(
  setProgress: ProgressFn,
  from: number,
  to: number,
  label: string,
  stage: ParseProgress["stage"],
  detail?: string,
) {
  let current = from;
  setProgress({ percent: current, label, stage, detail });
  const id = window.setInterval(() => {
    // Ease toward `to` but never reach it until the real work finishes.
    const gap = to - current;
    if (gap <= 0.5) return;
    current += Math.max(0.35, gap * 0.045);
    setProgress({
      percent: Math.min(to, current),
      label,
      stage,
      detail,
    });
  }, 320);
  return () => window.clearInterval(id);
}

/**
 * OPay / known wallet layout → local parse (no AI).
 * Anything else → OpenAI structures it before display.
 */
async function parseStatementFile(
  file: File,
  onProgress: ProgressFn,
): Promise<ParseResult> {
  onProgress({
    percent: 6,
    label: "Uploading statement…",
    stage: "reading",
    detail: file.name,
  });

  let local: ParseResult | null = null;
  try {
    onProgress({
      percent: 18,
      label: "Reading spreadsheet…",
      stage: "reading",
      detail: file.name,
    });
    local = await parseLedgerFile(file);
  } catch {
    local = null;
  }

  onProgress({
    percent: 32,
    label: "Checking statement format…",
    stage: "checking",
    detail: file.name,
  });

  const useLocal =
    local &&
    canUseLocalStructure(local) &&
    !needsAiRestructuring(local);

  if (useLocal && local) {
    console.info(
      `[giver] OPay/local structure OK for ${file.name}: ${local.transactions.length} rows`,
    );
    onProgress({
      percent: 78,
      label: "Wallet format recognized…",
      stage: "ranking",
      detail: "Fast path",
    });
    await new Promise((r) => setTimeout(r, 280));
    onProgress({
      percent: 94,
      label: "Preparing rankings…",
      stage: "ranking",
      detail: file.name,
    });
    return local;
  }

  console.info(
    `[giver] non-OPay / unknown layout → OpenAI for ${file.name}`,
    local
      ? {
          mode: local.meta.detectedMode,
          rows: local.sourceRowCount,
          txs: local.transactions.length,
        }
      : { local: "failed" },
  );

  const stopTicker = startProgressTicker(
    onProgress,
    38,
    88,
    "Structuring…",
    "structuring",
    file.name,
  );

  try {
    const ai = await structureStatementViaApi(file);
    stopTicker();
    if (ai.transactions.length) {
      onProgress({
        percent: 94,
        label: "Normalizing complete…",
        stage: "ranking",
        detail: `${ai.transactions.length} transactions`,
      });
      return ai;
    }
  } catch (aiErr) {
    stopTicker();
    if (local?.transactions.length) {
      console.warn(
        `[giver] OpenAI failed; keeping local rows for ${file.name}`,
        aiErr instanceof Error ? aiErr.message : aiErr,
      );
      onProgress({
        percent: 90,
        label: "Using local parse…",
        stage: "ranking",
        detail: file.name,
      });
      return local;
    }
    throw aiErr instanceof Error
      ? aiErr
      : new Error("Failed to structure statement.");
  }

  if (local?.transactions.length) return local;
  throw new Error("No transactions found after local + OpenAI parse.");
}

export type DashboardView = "overview" | "people" | "transactions" | "insights";

interface LedgerContextValue extends LedgerState {
  view: DashboardView;
  selectedPerson: string | null;
  sidebarOpen: boolean;
  loadFile: (file: File) => Promise<void>;
  loadFiles: (files: File[], mode?: "replace" | "append") => Promise<void>;
  reset: () => void;
  setView: (view: DashboardView) => void;
  selectPerson: (name: string) => void;
  clearPerson: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const initialState: LedgerState = {
  status: "idle",
  error: null,
  meta: null,
  transactions: [],
  insight: null,
  parseProgress: null,
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [state, setState] = useState<LedgerState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [view, setViewState] = useState<DashboardView>("overview");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadFiles = useCallback(
    async (files: File[], mode: "replace" | "append" = "replace") => {
      const list = [...files].filter(Boolean);
      if (!list.length) return;

      const wasReady = stateRef.current.status === "ready";
      const previous =
        wasReady
          ? {
              meta: stateRef.current.meta,
              transactions: stateRef.current.transactions,
              insight: stateRef.current.insight,
            }
          : null;

      setState((s) => ({
        ...s,
        status: "parsing",
        error: null,
        parseProgress: {
          percent: 2,
          label: "Starting…",
          stage: "reading",
          detail:
            list.length > 1 ? `${list.length} files` : list[0]?.name,
        },
      }));

      const report: ProgressFn = (patch) => {
        setState((s) => ({
          ...s,
          parseProgress: {
            percent: patch.percent ?? s.parseProgress?.percent ?? 0,
            label: patch.label,
            stage: patch.stage,
            detail: patch.detail ?? s.parseProgress?.detail,
          },
        }));
      };

      try {
        const invalid = list.find((file) => !isStatementFile(file));
        if (invalid) throw new Error(SPREADSHEET_TOAST);

        const parsed = [];
        for (let i = 0; i < list.length; i++) {
          const file = list[i];
          const fileDetail =
            list.length > 1
              ? `${file.name} (${i + 1}/${list.length})`
              : file.name;
          report({
            percent: Math.round((i / list.length) * 100 * 0.1),
            label: "Uploading statement…",
            stage: "reading",
            detail: fileDetail,
          });
          const result = await parseStatementFile(file, (p) =>
            report({ ...p, detail: p.detail ?? fileDetail }),
          );
          parsed.push(result);
        }

        report({
          percent: 96,
          label: "Computing rankings…",
          stage: "ranking",
          detail: `${parsed.reduce((n, p) => n + p.transactions.length, 0)} rows`,
        });

        const merged =
          mode === "append" && wasReady
            ? appendParseResults(
                previous!.transactions,
                previous!.meta,
                parsed,
              )
            : mergeParseResults(parsed);

        if (!merged.transactions.length) {
          throw new Error(
            "No transactions found. Try another Excel (.xlsx) export.",
          );
        }

        const insight = computeLedger(merged.transactions);
        report({
          percent: 100,
          label: "Done",
          stage: "done",
        });
        await new Promise((r) => setTimeout(r, 220));

        setState({
          status: "ready",
          error: null,
          meta: merged.meta,
          transactions: merged.transactions,
          insight,
          parseProgress: null,
        });
        setViewState("overview");
        setSelectedPerson(null);
        setSidebarOpen(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to parse file";
        if (message === SPREADSHEET_TOAST) {
          toast(SPREADSHEET_TOAST, "error");
        }
        if (mode === "append" && previous) {
          toast(message, "error");
          setState({
            status: "ready",
            error: null,
            meta: previous.meta,
            transactions: previous.transactions,
            insight: previous.insight,
            parseProgress: null,
          });
          return;
        }
        setState({
          ...initialState,
          status: "error",
          error: message,
          parseProgress: null,
        });
      }
    },
    [toast],
  );

  const loadFile = useCallback(
    async (file: File) => {
      await loadFiles([file], "replace");
    },
    [loadFiles],
  );

  const reset = useCallback(() => {
    setState(initialState);
    setViewState("overview");
    setSelectedPerson(null);
    setSidebarOpen(false);
  }, []);

  const setView = useCallback((next: DashboardView) => {
    setViewState(next);
    setSidebarOpen(false);
  }, []);

  const selectPerson = useCallback((name: string) => {
    setSelectedPerson(name);
    setSidebarOpen(false);
  }, []);

  const clearPerson = useCallback(() => {
    setSelectedPerson(null);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      view,
      selectedPerson,
      sidebarOpen,
      loadFile,
      loadFiles,
      reset,
      setView,
      selectPerson,
      clearPerson,
      setSidebarOpen,
    }),
    [
      state,
      view,
      selectedPerson,
      sidebarOpen,
      loadFile,
      loadFiles,
      reset,
      setView,
      selectPerson,
      clearPerson,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}
