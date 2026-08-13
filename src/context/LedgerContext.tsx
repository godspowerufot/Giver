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
import { isStatementFile, parseLedgerFile } from "@/lib/parse/parseFile";
import { needsAiRestructuring } from "@/lib/parse/needsAiRestructuring";
import { structureStatementViaApi } from "@/lib/parse/structureClient";
import type { ParseResult } from "@/lib/parse/parseFile";
import type { LedgerState } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

/**
 * Known CSV layouts → local parse into Transaction[].
 * Unknown / mismatched CSV layouts → Gemini (chunked for large files).
 */
async function parseStatementFile(file: File): Promise<ParseResult> {
  let local: ParseResult | null = null;
  try {
    local = await parseLedgerFile(file);
  } catch {
    local = null;
  }

  if (local && !needsAiRestructuring(local)) {
    console.info(
      `[giver] local CSV OK for ${file.name}: ${local.transactions.length} rows (${local.meta.detectedMode})`,
    );
    return local;
  }

  console.info(
    `[giver] unstructured CSV → Gemini for ${file.name}`,
    local
      ? {
          mode: local.meta.detectedMode,
          rows: local.sourceRowCount,
          txs: local.transactions.length,
        }
      : { local: "failed" },
  );

  try {
    const ai = await structureStatementViaApi(file);
    if (ai.transactions.length) return ai;
  } catch (aiErr) {
    if (local?.transactions.length) {
      console.warn(
        `[giver] Gemini failed; keeping local rows for ${file.name}`,
        aiErr instanceof Error ? aiErr.message : aiErr,
      );
      return local;
    }
    throw aiErr instanceof Error
      ? aiErr
      : new Error("Failed to structure CSV.");
  }

  if (local?.transactions.length) return local;
  throw new Error("No transactions found after local + Gemini parse.");
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

      setState((s) => ({ ...s, status: "parsing", error: null }));
      try {
        const invalid = list.find((file) => !isStatementFile(file));
        if (invalid) throw new Error(SPREADSHEET_TOAST);

        const parsed = [];
        for (const file of list) {
          parsed.push(await parseStatementFile(file));
        }

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
            "No transactions found. Try another CSV bank/wallet export.",
          );
        }

        const insight = computeLedger(merged.transactions);
        setState({
          status: "ready",
          error: null,
          meta: merged.meta,
          transactions: merged.transactions,
          insight,
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
          });
          return;
        }
        setState({
          ...initialState,
          status: "error",
          error: message,
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
