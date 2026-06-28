// Official public ATS job-board endpoints — the ToS-safe "no scraping" path.
// Greenhouse / Lever / Ashby each publish a company's open roles as JSON.
import { fetchJson, id, stripHtml, truncate, warn } from "../util.ts";
import { detectStack, looksRemote } from "./detect.ts";
import { WATCHLIST, type Target } from "../watchlist.ts";
import type { RawOpp } from "../types.ts";

async function greenhouse(t: Target): Promise<RawOpp[]> {
  const data = await fetchJson<{ jobs: any[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${t.slug}/jobs?content=true`
  );
  return (data.jobs || []).map((j) => {
    const jd = stripHtml(j.content || "");
    return {
      id: id("gh", t.slug, j.title, String(j.id)),
      source: `greenhouse:${t.slug}`,
      company: t.company,
      role: j.title,
      url: j.absolute_url,
      location: j.location?.name,
      remote: looksRemote((j.location?.name || "") + " " + jd),
      stack: detectStack(j.title + " " + jd),
      postedAt: j.updated_at,
      jd: truncate(`${j.title} @ ${t.company} — ${j.location?.name || ""}\n\n${jd}`, 1400),
    };
  });
}

async function lever(t: Target): Promise<RawOpp[]> {
  const data = await fetchJson<any>(`https://api.lever.co/v0/postings/${t.slug}?mode=json`);
  if (!Array.isArray(data)) return []; // {ok:false,...} for non-customers
  return data.map((p) => {
    const jd = stripHtml(p.descriptionPlain || p.description || "");
    const loc = p.categories?.location;
    return {
      id: id("lever", t.slug, p.text, p.id || p.hostedUrl),
      source: `lever:${t.slug}`,
      company: t.company,
      role: p.text,
      url: p.hostedUrl,
      location: loc,
      remote: looksRemote((loc || "") + " " + jd),
      stack: detectStack(p.text + " " + jd),
      postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      jd: truncate(`${p.text} @ ${t.company} — ${loc || ""}\n\n${jd}`, 1400),
    };
  });
}

async function ashby(t: Target): Promise<RawOpp[]> {
  const data = await fetchJson<{ jobs: any[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${t.slug}?includeCompensation=true`
  );
  return (data.jobs || []).map((j) => {
    const jd = stripHtml(j.descriptionPlain || j.descriptionHtml || "");
    const comp = j.compensation?.compensationTierSummary;
    return {
      id: id("ashby", t.slug, j.title, j.id || j.jobUrl),
      source: `ashby:${t.slug}`,
      company: t.company,
      role: j.title,
      url: j.jobUrl || j.applyUrl,
      location: j.location,
      remote: !!j.isRemote || looksRemote((j.location || "") + " " + jd),
      comp: comp || undefined,
      stack: detectStack(j.title + " " + jd),
      postedAt: j.publishedAt,
      jd: truncate(`${j.title} @ ${t.company} — ${j.location || ""}\n\n${jd}`, 1400),
    };
  });
}

const RUNNERS = { greenhouse, lever, ashby } as const;

export async function fetchATS(): Promise<RawOpp[]> {
  const results = await Promise.allSettled(
    WATCHLIST.map(async (t) => {
      try {
        return await RUNNERS[t.ats](t);
      } catch (e) {
        warn(`ats ${t.ats}:${t.slug}`, e);
        return [] as RawOpp[];
      }
    })
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
