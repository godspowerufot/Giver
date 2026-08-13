export type ShareCardKind = "celebration" | "thanks";

export type ShareCardPayload = {
  k: ShareCardKind;
  n: string;
  h: string;
  r: string;
  p: number;
  a: number;
  c: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShareCard(payload: ShareCardPayload): string {
  const json = JSON.stringify(payload);
  return toBase64Url(new TextEncoder().encode(json));
}

export function decodeShareCard(token: string): ShareCardPayload | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(token));
    const data = JSON.parse(json) as ShareCardPayload;
    if (!data?.n || !data?.h || !data?.r) return null;
    if (data.k !== "celebration" && data.k !== "thanks") return null;
    return {
      k: data.k,
      n: String(data.n).slice(0, 80),
      h: String(data.h).slice(0, 120),
      r: String(data.r).slice(0, 400),
      p: Number(data.p) || 0,
      a: Number(data.a) || 0,
      c: Number(data.c) || 0,
    };
  } catch {
    return null;
  }
}

export function shareCardPath(token: string): string {
  return `/card?d=${encodeURIComponent(token)}`;
}
