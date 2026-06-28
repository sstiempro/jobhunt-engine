// Remotive public API. NOTE (per their legal notice): always link back to the Remotive
// job URL and credit Remotive as the source. We store job.url (their URL) and source="remotive".
import { fetchJson, id, stripHtml, truncate } from "../util.ts";
import { detectStack } from "./detect.ts";
import type { RawOpp } from "../types.ts";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  tags: string[];
  publication_date: string;
}

export async function fetchRemotive(): Promise<RawOpp[]> {
  const data = await fetchJson<{ jobs: RemotiveJob[] }>(
    "https://remotive.com/api/remote-jobs?category=software-dev&limit=120"
  );
  return (data.jobs || []).map((j) => {
    const desc = stripHtml(j.description || "");
    return {
      id: id("remotive", j.company_name, j.title, String(j.id)),
      source: "remotive",
      company: j.company_name,
      role: j.title,
      url: j.url, // link back to Remotive (required)
      location: j.candidate_required_location || "Remote",
      remote: true,
      comp: j.salary || undefined,
      stack: [...new Set([...(j.tags || []).map((t) => t.toLowerCase()), ...detectStack(j.title + " " + desc)])].slice(0, 12),
      postedAt: j.publication_date,
      jd: truncate(`${j.title} @ ${j.company_name}\n\n${desc}`, 1400),
    };
  });
}
