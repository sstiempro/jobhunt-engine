import { load, save, upsert, all } from "./store.ts";
import { warn } from "./util.ts";
import { score } from "./score.ts";
import { draft } from "./draft.ts";
import { enrichContacts } from "./contacts.ts";
import { watchReplies } from "./replywatch.ts";
import { buildDashboard } from "./dashboard.ts";
import { fetchHN } from "./sources/hn.ts";
import { fetchRemotive } from "./sources/remotive.ts";
import { fetchRemoteOK } from "./sources/remoteok.ts";
import { fetchATS } from "./sources/ats.ts";
import type { DB, RawOpp } from "./types.ts";

const SOURCES: { name: string; run: () => Promise<RawOpp[]> }[] = [
  { name: "hn (who is hiring)", run: fetchHN },
  { name: "remotive", run: fetchRemotive },
  { name: "remoteok", run: fetchRemoteOK },
  { name: "ats watchlist", run: fetchATS },
];

const DRAFT_FLOOR = 55; // auto-draft letter+opener for anything this fit or above

export async function fetchAll(db: DB): Promise<number> {
  console.log("→ fetching sources…");
  let added = 0;
  const results = await Promise.allSettled(
    SOURCES.map(async (s) => {
      const rows = await s.run();
      console.log(`  · ${s.name}: ${rows.length}`);
      return rows;
    })
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") return warn(SOURCES[i].name, r.reason);
    for (const raw of r.value) {
      const before = !!db.opportunities[raw.id];
      upsert(db, raw);
      if (!before) added++;
    }
  });
  console.log(`→ ${added} new (${all(db).length} total)`);
  return added;
}

export function scoreAll(db: DB) {
  for (const o of all(db)) score(o);
}

export function draftAll(db: DB): number {
  let n = 0;
  for (const o of all(db)) {
    if ((o.fitScore ?? 0) >= DRAFT_FLOOR && !o.letter) {
      draft(o);
      n++;
    }
  }
  return n;
}

export async function run(): Promise<DB> {
  const db = load();
  await fetchAll(db);
  scoreAll(db);
  const contacts = await enrichContacts(db, DRAFT_FLOOR);
  const drafted = draftAll(db);
  console.log(`→ scored ${all(db).length}, found ${contacts} warm contacts, drafted ${drafted} (fit ≥ ${DRAFT_FLOOR})`);
  const replies = await watchReplies(db, { verbose: false }); // no-op until you configure GMAIL_* env
  if (replies !== null) console.log(`→ reply-watch: ${replies} new replies`);
  db.meta.lastRun = new Date().toISOString();
  db.meta.runs = (db.meta.runs || 0) + 1;
  save(db);
  const out = buildDashboard(db);
  console.log(`→ dashboard: ${out}`);
  return db;
}
