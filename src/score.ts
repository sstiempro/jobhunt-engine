// Keyless heuristic fit-scorer. No API key needed (honors the keyless-first ethos).
// Structured so an LLM re-score can slot in later behind the same interface.
import {
  STRONG, AI, QUANT, ROLE_BOOST, TITLE_PENALTY, GAP_SIGNALS, leadProjectFor,
} from "./profile.ts";
import type { Opportunity } from "./types.ts";

function countHits(text: string, kws: string[]): number {
  const t = " " + text.toLowerCase() + " ";
  let n = 0;
  for (const k of kws) if (t.includes(k.toLowerCase())) n++;
  return n;
}

function firstSentenceWith(text: string, kws: string[]): string | undefined {
  const sentences = text.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/);
  const lk = kws.map((k) => k.toLowerCase());
  for (const s of sentences) {
    const ls = s.toLowerCase();
    if (lk.some((k) => ls.includes(k)) && s.trim().length > 25 && s.trim().length < 240)
      return s.trim();
  }
  return undefined;
}

export function score(o: Opportunity): Opportunity {
  const blob = `${o.role}\n${o.jd}`;
  const title = o.role.toLowerCase();

  let s = 28; // base

  s += Math.min(countHits(blob, STRONG) * 5, 26); // his core stack
  s += Math.min(countHits(blob, AI) * 4.5, 22);   // AI/agentic
  s += Math.min(countHits(blob, QUANT) * 4, 16);  // crypto/quant niche

  // bullseye title
  if (ROLE_BOOST.some((r) => title.includes(r))) s += 14;

  // remote / comp niceties
  if (o.remote) s += 5;
  if (o.comp) s += 3;

  // non-IC role → push down hard
  if (TITLE_PENALTY.some((p) => title.includes(p))) s -= 28;

  // honest gaps (small penalty + label)
  const gaps: string[] = [];
  for (const g of GAP_SIGNALS) {
    if (g.kw.some((k) => blob.toLowerCase().includes(k))) {
      gaps.push(g.label);
      s -= 4;
    }
  }

  // seniority sanity: "principal/staff" fine; require-heavy years mild penalty
  if (/\b(8|9|10|12)\+?\s*years\b/.test(blob)) s -= 5;

  o.fitScore = Math.max(0, Math.min(100, Math.round(s)));
  o.leadProject = leadProjectFor(blob);
  o.gaps = gaps;
  o.hook =
    firstSentenceWith(o.jd, [...AI, ...QUANT, ...STRONG]) ||
    firstSentenceWith(o.jd, ROLE_BOOST) ||
    undefined;

  return o;
}
