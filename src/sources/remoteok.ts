// RemoteOK public API. First array element is metadata/legal — skip it. Requires a UA header.
import { fetchJson, id, stripHtml, truncate } from "../util.ts";
import { detectStack } from "./detect.ts";
import type { RawOpp } from "../types.ts";

interface RokJob {
  slug?: string;
  id?: string;
  position?: string;
  company?: string;
  url?: string;
  apply_url?: string;
  tags?: string[];
  description?: string;
  location?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
}

export async function fetchRemoteOK(): Promise<RawOpp[]> {
  const arr = await fetchJson<RokJob[]>("https://remoteok.com/api");
  const jobs = arr.filter((j) => j && j.position && j.company);
  return jobs.map((j) => {
    const desc = stripHtml(j.description || "");
    const comp =
      j.salary_min && j.salary_max ? `$${j.salary_min.toLocaleString()}–$${j.salary_max.toLocaleString()}` : undefined;
    return {
      id: id("remoteok", j.company!, j.position!, String(j.id || j.slug || "")),
      source: "remoteok",
      company: j.company!,
      role: j.position!,
      url: j.url || j.apply_url || `https://remoteok.com/remote-jobs/${j.slug || ""}`,
      location: j.location || "Remote",
      remote: true,
      comp,
      stack: [...new Set([...(j.tags || []).map((t) => t.toLowerCase()), ...detectStack(j.position + " " + desc)])].slice(0, 12),
      postedAt: j.date,
      jd: truncate(`${j.position} @ ${j.company}\n\n${desc}`, 1400),
    };
  });
}
