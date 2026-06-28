// Hacker News "Ask HN: Who is hiring?" — via the OFFICIAL free Algolia HN API (no key).
// Founder-direct, builder-first: your highest-fit channel.
import { fetchJson, id, stripHtml, truncate } from "../util.ts";
import { detectStack, looksRemote } from "./detect.ts";
import type { RawOpp } from "../types.ts";

interface AlgoliaHit { objectID: string; title: string; created_at: string }
interface AlgoliaItem {
  id: number;
  title?: string;
  children?: { author?: string; text?: string; children?: any[] }[];
}

// Only keep top-level posts that read like real job posts.
function looksLikeJobPost(text: string): boolean {
  const t = text.toLowerCase();
  return /hiring|engineer|developer|remote|onsite|full.?time|contract|apply|role|position/.test(t);
}

export async function fetchHN(): Promise<RawOpp[]> {
  // newest "Who is hiring?" thread posted by the whoishiring bot
  const search = await fetchJson<{ hits: AlgoliaHit[] }>(
    "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10"
  );
  const thread = search.hits.find((h) => /who is hiring/i.test(h.title));
  if (!thread) return [];

  const item = await fetchJson<AlgoliaItem>(`https://hn.algolia.com/api/v1/items/${thread.objectID}`);
  const posts = (item.children || []).filter((c) => c?.text);

  const out: RawOpp[] = [];
  for (const p of posts) {
    const text = stripHtml(p.text || "");
    if (text.length < 60 || !looksLikeJobPost(text)) continue;

    // first line is almost always "Company | Role | Location | REMOTE | ..."
    const firstLine = text.split("\n").map((s) => s.trim()).find(Boolean) || "";
    const segs = firstLine.split(/\s*[|•·–—]\s*/).filter(Boolean);
    const company = (segs[0] || "Unknown").slice(0, 60);
    const role =
      segs.slice(1).find((s) => /eng|dev|scien|design|product|ai|ml|founder|lead|architect/i.test(s)) ||
      segs[1] ||
      truncate(firstLine, 80);

    out.push({
      id: id("hn", company, role, thread.objectID),
      source: "hn",
      company,
      role: role.slice(0, 90),
      url: `https://news.ycombinator.com/item?id=${item.id}`, // thread; the post is inside
      location: segs.find((s) => /remote|onsite|hybrid|usa|us\b|europe|sf|nyc|austin/i.test(s)),
      remote: looksRemote(text),
      stack: detectStack(text),
      postedAt: thread.created_at,
      jd: truncate(text, 1400),
      contact: p.author ? `HN: ${p.author}` : undefined,
    });
  }
  return out;
}
