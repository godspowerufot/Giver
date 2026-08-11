"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { computeLedger } from "@/lib/analytics/computeLedger";
import { parseLedgerFile } from "@/lib/parse/parseFile";
import type { LedgerState } from "@/lib/types";

export type DashboardView = "overview" | "people" | "transactions" | "insights";

interface LedgerContextValue extends LedgerState {
  view: DashboardView;
  selectedPerson: string | null;
  sidebarOpen: boolean;
  loadFile: (file: File) => Promise<void>;
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
  const [state, setState] = useState<LedgerState>(initialState);
  const [view, setViewState] = useState<DashboardView>("overview");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, status: "parsing", error: null }));
    try {
      const { transactions, meta } = await parseLedgerFile(file);
      if (!transactions.length) {
        throw new Error(
          "No transactions found. Use a CSV/XLSX with debit/credit columns or signed amounts.",
        );
      }
      const insight = computeLedger(transactions);
      setState({
        status: "ready",
        error: null,
        meta,
        transactions,
        insight,
      });
      setViewState("overview");
      setSelectedPerson(null);
      setSidebarOpen(false);
    } catch (err) {
      setState({
        ...initialState,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to parse file",
      });
    }
  }, []);

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
