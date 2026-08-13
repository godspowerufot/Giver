"use client";

import { useCallback, useId, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { SPREADSHEET_TOAST } from "@/lib/messages";
import { isStatementFile } from "@/lib/parse/parseFile";
import { useLedger } from "@/hooks/useLedger";

const ACCEPT = ".csv,text/csv";

export function FileDropzone({
  mode = "replace",
  compact = false,
}: {
  mode?: "replace" | "append";
  compact?: boolean;
}) {
  const { loadFiles, status, error } = useLedger();
  const { toast } = useToast();
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const busy = status === "parsing";

  const onFiles = useCallback(
    async (files: FileList | null) => {
      const list = files ? [...files] : [];
      if (!list.length) return;
      if (list.some((file) => !isStatementFile(file))) {
        toast(SPREADSHEET_TOAST, "error");
        return;
      }
      await loadFiles(list, mode);
    },
    [loadFiles, mode, toast],
  );

  if (compact) {
    return (
      <>
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-white/40 hover:bg-white/5 ${
            busy ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {busy ? "Parsing…" : "Add CSV"}
        </label>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </>
    );
  }

  return (
    <div className="relative z-20 mx-auto w-full min-w-0 max-w-2xl overflow-x-clip">
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
        className={`relative w-full min-w-0 overflow-hidden rounded-2xl border border-dashed px-4 py-10 text-center transition sm:px-6 sm:py-14 ${
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
            CSV only for now. Known bank layouts parse in-browser; unknown column
            layouts are rewritten with Gemini Flash into clean ranked rows.
          </p>
          <div className="relative z-20 mt-6 flex justify-center sm:mt-8">
            <label
              htmlFor={inputId}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-4 py-2.5 text-sm font-medium tracking-wide text-black shadow-[0_0_24px_rgba(255,255,255,0.18)] transition duration-200 sm:w-auto ${
                busy ? "pointer-events-none cursor-not-allowed opacity-40" : ""
              }`}
            >
              {busy ? "Parsing…" : "Choose CSV"}
            </label>
            <input
              id={inputId}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-zinc-500">
            Export CSV from your bank or wallet. Multiple files can be merged and
            deduped in this session.
          </p>
        </div>
      </div>
      {error ? (
        <p className="mt-4 text-center text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}
