export type Status =
  | "sourced"
  | "drafted"
  | "applied"
  | "sent"
  | "replied"
  | "screen"
  | "interview"
  | "offer"
  | "closed";

export interface Opportunity {
  id: string;            // stable hash of source+company+role
  source: string;        // hn | remotive | remoteok | greenhouse:anthropic | ashby:openai | ...
  company: string;
  role: string;
  url: string;           // the canonical apply/listing URL (always link back to source)
  location?: string;
  remote?: boolean;
  comp?: string;
  stack: string[];       // detected tech tags
  postedAt?: string;     // ISO date if known
  jd: string;            // plain-text JD excerpt (truncated)
  contact?: string;      // a name/handle if the post exposed one (e.g. HN poster)

  // engine-derived
  fitScore?: number;     // 0-100
  leadProject?: string;  // which flagship to headline
  hook?: string;         // one-line "why this matches" pulled from the JD
  gaps?: string[];       // honest gaps to name (e.g. "wants Rust")

  // drafted artifacts
  letter?: string;
  opener?: string;

  // contact enrichment (keyless: HN poster public profile)
  contactEmail?: string;
  contactNote?: string;   // links/handles pulled from the poster's public profile
  contactChecked?: boolean;

  status: Status;
  firstSeen: string;
  lastSeen: string;
}

export interface DB {
  opportunities: Record<string, Opportunity>;
  meta: { lastRun?: string; runs: number };
}

// What a source fetcher returns (listing fields only; engine fills the rest).
export type RawOpp = Pick<
  Opportunity,
  | "id" | "source" | "company" | "role" | "url" | "location"
  | "remote" | "comp" | "stack" | "postedAt" | "jd" | "contact"
>;
