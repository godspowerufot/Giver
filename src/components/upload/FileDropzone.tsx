"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLedger } from "@/hooks/useLedger";

export function FileDropzone() {
  const { loadFile, status, error } = useLedger();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = status === "parsing";

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
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
            Drop your statement
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            Upload a CSV or Excel statement to see who you send the most to.
            Debit/credit columns or signed amounts are auto-detected.
          </p>
          <div className="mt-6 flex justify-center sm:mt-8">
            <Button
              disabled={busy}
              className="w-full sm:w-auto"
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Reading…" : "Choose file"}
            </Button>
          </div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-zinc-500">
            Your file is read only in this browser. It is not uploaded or saved
            anywhere — nothing leaves your device.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
      </div>
      {error ? (
        <p className="mt-4 text-center text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
