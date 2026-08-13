"use client";

import { useCallback, useState } from "react";
import {
  encodeShareCard,
  shareCardPath,
  type ShareCardPayload,
} from "@/lib/shareCard";

export function useShareCardLink() {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (payload: ShareCardPayload) => {
    setBusy(true);
    setCopied(false);
    try {
      const token = encodeShareCard(payload);
      const url = `${window.location.origin}${shareCardPath(token)}`;
      const title =
        payload.k === "thanks" ? "Thank-you card · Giver" : "Celebration card · Giver";
      const text = `${payload.h}\n“${payload.r}”`;

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return { url, shared: true as const };
        } catch (err) {
          // User cancelled share sheet — still offer copy.
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
