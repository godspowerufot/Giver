"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLedger } from "@/hooks/useLedger";

function isExcelOrCsv(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".csv");
}

export function FileDropzone() {
  const { loadFile, status, error } = useLedger();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = status === "parsing";

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!isExcelOrCsv(file)) {
        setLocalError(
          "Please upload Excel (.xlsx) or CSV (.csv). PDF and other formats are not supported.",
        );
        return;
      }
      setLocalError(null);
      await loadFile(file);
    },
    [loadFile],
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
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
        <div className="pointer-events-none absolute inset-0 lightning-veil opacity-40" />
        <div className="relative">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
            Upload your statement
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            Use Excel (.xlsx) or CSV (.csv) from your bank or wallet. Debit/credit
            columns or signed amounts are auto-detected.
          </p>
          <div className="mt-6 flex justify-center sm:mt-8">
            <Button
              disabled={busy}
              className="w-full sm:w-auto"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Reading…" : "Choose Excel or CSV"}
            </Button>
          </div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-zinc-500">
            Excel or CSV only — not PDF. Your file is read only in this browser.
            It is not uploaded or saved anywhere.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {localError || error ? (
        <p className="mt-4 text-center text-sm text-red-300">
          {localError || error}
        </p>
      ) : null}
    </div>
  );
}
