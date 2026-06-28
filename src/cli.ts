import { load, save, all } from "./store.ts";
import { fetchAll, scoreAll, draftAll, run } from "./pipeline.ts";
import { watchReplies } from "./replywatch.ts";
import { buildDashboard } from "./dashboard.ts";
import type { Status } from "./types.ts";

const cmd = process.argv[2] || "run";
const args = process.argv.slice(3);
function flag(name: string, def?: string) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}

function top(min: number, limit = 40) {
  return all(load())
    .filter((o) => (o.fitScore ?? 0) >= min)
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    .slice(0, limit);
}

switch (cmd) {
  case "run":
    await run();
    break;

  case "fetch": {
    const db = load();
    await fetchAll(db);
    save(db);
    break;
  }

  case "score": {
    const db = load();
    scoreAll(db);
    save(db);
    console.log(`scored ${all(db).length}`);
    break;
  }

  case "draft": {
    const db = load();
    scoreAll(db);
    const n = draftAll(db);
    save(db);
    console.log(`drafted ${n}`);
    break;
  }

  case "dashboard":
    console.log(buildDashboard(load()));
    break;

  case "replies": {
    const db = load();
    const n = await watchReplies(db, { verbose: true });
    if (n !== null) {
      save(db);
      buildDashboard(db);
      console.log(`reply-watch: ${n} new repl${n === 1 ? "y" : "ies"} detected → flipped to 'replied' + drafted a response.`);
    }
    break;
  }

  case "pipeline": {
    const order: Status[] = ["sourced", "drafted", "applied", "sent", "replied", "screen", "interview", "offer", "closed"];
    const rows = all(load());
    const counts = Object.fromEntries(order.map((s) => [s, rows.filter((o) => o.status === s).length]));
    console.log("\nFunnel:");
    for (const s of order) console.log(`  ${s.padEnd(10)} ${"█".repeat(Math.min(counts[s], 40))} ${counts[s]}`);
    const live = rows.filter((o) => ["replied", "screen", "interview", "offer"].includes(o.status));
    if (live.length) {
      console.log("\nLive conversations (human takes over here):");
      for (const o of live) console.log(`  [${o.status}] ${o.company} — ${o.role}  ${o.contactEmail || ""}`);
    }
    console.log("");
    break;
  }

  case "list": {
    const min = Number(flag("min", "65"));
    const rows = top(min);
    console.log(`\nTop ${rows.length} roles (fit ≥ ${min}):\n`);
    for (const o of rows) {
      console.log(`  ${String(o.fitScore).padStart(3)}  ${o.company}  —  ${o.role}`);
      console.log(`       ${o.location || ""} ${o.remote ? "· remote" : ""}  · ${o.source}`);
      if (o.gaps?.length) console.log(`       ⚠ ${o.gaps.join("; ")}`);
      console.log(`       ${o.url}`);
    }
    console.log("");
    break;
  }

  default:
    console.log(`Jobhunt Engine — commands:
  run         fetch all sources → score → draft (fit≥55) → dashboard   [default]
  fetch       pull sources into the DB only
  score       re-score everything
  draft       (re)draft letters/openers for high-fit roles
  dashboard   regenerate data/dashboard.html
  replies     poll your inbox → flip applied roles to 'replied' + draft a reply (needs GMAIL_* env)
  pipeline    print the funnel + your live conversations
  list --min 70   print top roles to the terminal`);
}
