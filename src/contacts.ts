// Contact finder (keyless). The strongest warm-contact source is the HN "Who is hiring"
// poster: on those threads the person posting is usually the founder/hiring manager, and
// their PUBLIC HN profile frequently lists an email + socials. We read it via the official
// keyless HN Firebase API and attach a real, reachable contact to the opportunity.
//
// LinkedIn people are deliberately NOT scraped (ToS/auth). For non-HN roles you network
// through the company page / the role's listed contact — the engine drafts the opener.
import { fetchJson, stripHtml, sleep, warn } from "./util.ts";
import { all } from "./store.ts";
import type { DB, Opportunity } from "./types.ts";

const EMAIL = /[a-z0-9._%+-]+\s?(?:@|\(at\)|\s+at\s+)\s?[a-z0-9.-]+\s?(?:\.|\(dot\)|\s+dot\s+)\s?[a-z]{2,}/i;
const URL = /\bhttps?:\/\/[^\s"'<>]+/gi;

function normalizeEmail(s: string): string {
  return s.replace(/\s?\(at\)\s?|\s+at\s+/i, "@").replace(/\s?\(dot\)\s?|\s+dot\s+/i, ".").replace(/\s+/g, "");
}

async function hnUserAbout(username: string): Promise<string | null> {
  try {
    const u = await fetchJson<{ about?: string }>(
      `https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(username)}.json`
    );
    return u?.about ? stripHtml(u.about) : null;
  } catch (e) {
    warn(`hn-user ${username}`, e);
    return null;
  }
}

/** Enrich HN-sourced, actionable opportunities with the poster's reachable contact info. */
export async function enrichContacts(db: DB, minFit = 55, cap = 120): Promise<number> {
  const targets = all(db)
    .filter((o) => o.source === "hn" && !o.contactChecked && (o.fitScore ?? 0) >= minFit && o.contact?.startsWith("HN: "))
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    .slice(0, cap);

  // dedupe HN usernames so we fetch each profile once
  const cache = new Map<string, string | null>();
  let found = 0;

  for (const o of targets) {
    const user = o.contact!.replace("HN: ", "").trim();
    let about = cache.get(user);
    if (about === undefined) {
      about = await hnUserAbout(user);
      cache.set(user, about);
      await sleep(60); // be polite
    }
    o.contactChecked = true;
    if (!about) continue;

    const em = about.match(EMAIL);
    if (em) o.contactEmail = normalizeEmail(em[0]);
    const links = (about.match(URL) || []).slice(0, 3);
    const note = [links.join(" · ")].filter(Boolean).join(" ");
    if (note) o.contactNote = note.slice(0, 200);
    if (o.contactEmail || note) found++;
  }
  return found;
}
