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

function shareMessage(payload: ShareCardPayload, url: string) {
  return `${payload.h}\n“${payload.r}”\n\nOpen on Giver:\n${url}`;
}

export function useShareCardLink() {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const withUrl = useCallback(async (payload: ShareCardPayload) => {
    setBusy(true);
    try {
      return await createShareUrl(payload);
    } finally {
      setBusy(false);
    }
  }, []);

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

  const shareWhatsApp = useCallback(
    async (payload: ShareCardPayload) => {
      const url = await withUrl(payload);
      const wa = `https://wa.me/?text=${encodeURIComponent(shareMessage(payload, url))}`;
      window.open(wa, "_blank", "noopener,noreferrer");
      return { url };
    },
    [withUrl],
  );

  const shareGmail = useCallback(
    async (payload: ShareCardPayload) => {
      const url = await withUrl(payload);
      const subject =
        payload.k === "thanks" ? "Thank-you card · Giver" : "Celebration card · Giver";
      const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage(payload, url))}`;
      window.open(href, "_blank", "noopener,noreferrer");
      return { url };
    },
    [withUrl],
  );

  const shareX = useCallback(
    async (payload: ShareCardPayload) => {
      const url = await withUrl(payload);
      const tweet = `${payload.h} — ${payload.r}\n\n${url}`;
      const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
      window.open(href, "_blank", "noopener,noreferrer");
      return { url };
    },
    [withUrl],
  );

  const shareInstagram = useCallback(
    async (payload: ShareCardPayload) => {
      const url = await withUrl(payload);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        /* still open IG */
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      return { url, copied: true as const };
    },
    [withUrl],
  );

  return {
    share,
    shareWhatsApp,
    shareGmail,
    shareX,
    shareInstagram,
    busy,
    copied,
  };
}
