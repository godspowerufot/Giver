"use client";

import { useCallback, useState } from "react";
import {
  encodeShareCard,
  shareCardPath,
  type ShareCardPayload,
} from "@/lib/shareCard";

async function createShareUrl(payload: ShareCardPayload): Promise<string> {
  try {
    const res = await fetch("/api/share-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("share api failed");
    const data = (await res.json()) as { url?: string };
    if (data.url) return data.url;
  } catch {
    /* fall back below */
  }
  return `${window.location.origin}${shareCardPath(encodeShareCard(payload))}`;
}

export function useShareCardLink() {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (payload: ShareCardPayload) => {
    setBusy(true);
    setCopied(false);
    try {
      const url = await createShareUrl(payload);
      const title =
        payload.k === "thanks" ? "Thank-you card · Giver" : "Celebration card · Giver";
      const text = `${payload.h}\n“${payload.r}”\n\nOpen on Giver:`;

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return { url, shared: true as const };
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            return { url, shared: false as const };
          }
        }
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      return { url, shared: false as const, copied: true as const };
    } finally {
      setBusy(false);
    }
  }, []);

  return { share, busy, copied };
}
