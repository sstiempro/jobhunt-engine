import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DB, Opportunity } from "./types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = join(ROOT, "data");
const DB_PATH = join(DATA_DIR, "db.json");

export function load(): DB {
  if (!existsSync(DB_PATH)) return { opportunities: {}, meta: { runs: 0 } };
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf8"));
  } catch {
    return { opportunities: {}, meta: { runs: 0 } };
  }
}

export function save(db: DB) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Upsert a freshly-fetched opportunity. PRESERVES human/engine state across re-fetches:
 * status, letter, opener, fitScore are kept if already set — so a re-run never
 * clobbers an application you've already moved forward.
 */
export function upsert(db: DB, fresh: Omit<Opportunity, "status" | "firstSeen" | "lastSeen">) {
  const now = new Date().toISOString();
  const existing = db.opportunities[fresh.id];
  if (existing) {
    existing.lastSeen = now;
    // refresh volatile listing fields but keep funnel state
    existing.comp = fresh.comp ?? existing.comp;
    existing.location = fresh.location ?? existing.location;
    existing.jd = fresh.jd || existing.jd;
    existing.url = fresh.url || existing.url;
    return existing;
  }
  const created: Opportunity = {
    ...fresh,
    status: "sourced",
    firstSeen: now,
    lastSeen: now,
  };
  db.opportunities[fresh.id] = created;
  return created;
}

export function all(db: DB): Opportunity[] {
  return Object.values(db.opportunities);
}
