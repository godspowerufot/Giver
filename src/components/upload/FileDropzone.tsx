"use client";

import { useCallback, useId, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import { useLedger } from "@/hooks/useLedger";

function isExcelOrCsv(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".csv");
}

export function FileDropzone() {
  const { loadFile, status, error } = useLedger();
  const { toast } = useToast();
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const busy = status === "parsing";

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!isExcelOrCsv(file)) {
        toast(SPREADSHEET_TOAST, "error");
        return;
      }
      await loadFile(file);
    },
    [loadFile, toast],
  );

  return (
    <div className="relative z-20 mx-auto w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void onFiles(e.dataTransfer.files);
        }}
        className={`relative overflow-hidden rounded-2xl border border-dashed px-4 py-10 text-center transition sm:px-6 sm:py-14 ${
          dragging
            ? "border-white bg-white/10"
            : "border-white/20 bg-white/[0.03] hover:border-white/40"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 lightning-veil opacity-40"
        />
        <div className="relative z-10">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
            Upload your statement
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            Use Excel (.xlsx) or CSV (.csv) from your bank or wallet. Debit/credit
            columns or signed amounts are auto-detected.
          </p>
          <div className="relative z-20 mt-6 flex justify-center sm:mt-8">
            <label
              htmlFor={inputId}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-4 py-2.5 text-sm font-medium tracking-wide text-black shadow-[0_0_24px_rgba(255,255,255,0.18)] transition duration-200 sm:w-auto ${
                busy ? "pointer-events-none cursor-not-allowed opacity-40" : ""
              }`}
            >
              {busy ? "Reading…" : "Choose Excel or CSV"}
            </label>
            <input
              id={inputId}
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-zinc-500">
            Excel or CSV only — not PDF. Your file is read only in this browser.
            It is not uploaded or saved anywhere.
          </p>
        </div>
      </div>
      {error ? (
        <p className="mt-4 text-center text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
