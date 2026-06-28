import { createHash } from "node:crypto";

export const UA =
  "jobhunt-engine/0.1 (+https://portfolio.sstiem.com; personal job search; respects source ToS)";

export async function fetchJson<T = any>(url: string, ms = 25000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchText(url: string, ms = 25000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export function id(...parts: string[]): string {
  return createHash("sha1").update(parts.join("|").toLowerCase()).digest("hex").slice(0, 12);
}

const ENT: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#x27;": "'", "&#39;": "'", "&#x2F;": "/", "&#47;": "/", "&nbsp;": " ",
};

export function stripHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, (m) => ENT[m.toLowerCase()] ?? " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n).trimEnd() + "…";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function warn(src: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.warn(`  ! ${src}: ${msg}`);
}
