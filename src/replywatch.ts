// Reply-watch — the "who messaged back" handoff. Polls your inbox over IMAP, matches
// inbound mail to in-flight applications, flips them to `replied`, and drafts your response.
// From `replied` on, it's you + the conversation — the bot's job is done.
//
// CREDENTIAL BOUNDARY: this reads YOUR mailbox, so it needs YOUR credential — which only
// YOU supply, via environment variables. The engine never stores or prints the secret.
//   1) Gmail → create an App Password (myaccount.google.com → Security → App passwords)
//   2) export GMAIL_USER="you@gmail.com"  GMAIL_APP_PASSWORD="the 16-char app password"
//   3) npm i imapflow         (optional dep, pure-JS IMAP client)
//   4) npm run replies        (or it runs automatically inside `npm run run` once configured)
// Works with any IMAP host via GMAIL_IMAP_HOST (defaults to imap.gmail.com).
import { all } from "./store.ts";
import { IDENTITY } from "./profile.ts";
import type { DB, Opportunity } from "./types.ts";

function companyToken(name: string): string {
  return (name.split(/\s|\//)[0] || name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function draftReply(o: Opportunity, fromName: string): string {
  return `Hi ${fromName || o.company},

Thanks so much for getting back to me — great to hear from ${o.company}.

I'd love to find time to talk through the ${o.role} role and where I can add the most value. I'm flexible this week — happy to work around your calendar; just send a couple of windows that suit you.

In the meantime everything I've built is here: ${IDENTITY.portfolio}.

Looking forward to it,
${IDENTITY.name}
${IDENTITY.email}`;
}

interface WatchOpts { verbose?: boolean; sinceDays?: number }

/** Returns count of newly-detected replies, or null if not configured. */
export async function watchReplies(db: DB, opts: WatchOpts = {}): Promise<number | null> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const host = process.env.GMAIL_IMAP_HOST || "imap.gmail.com";

  if (!user || !pass) {
    if (opts.verbose) {
      console.log(`\n  reply-watch is not configured (this is your one identity-click).
  To turn it on:
    1) Gmail → create an App Password: https://myaccount.google.com/apppasswords
    2) export GMAIL_USER="you@gmail.com"
       export GMAIL_APP_PASSWORD="xxxxxxxxxxxxxxxx"
    3) npm i imapflow
  Then re-run. The engine never sees or stores the password — it reads it from your env.\n`);
    }
    return null;
  }

  let ImapFlow: any;
  try {
    ({ ImapFlow } = await import("imapflow"));
  } catch {
    if (opts.verbose) console.log("  reply-watch: run `npm i imapflow` to enable the IMAP client.");
    return null;
  }

  // only match mail to applications that are actually out the door
  const inflight = all(db).filter((o) => o.status === "applied" || o.status === "sent");
  if (inflight.length === 0) {
    if (opts.verbose) console.log("  reply-watch: no applications marked applied/sent yet — nothing to match.");
    return 0;
  }
  const byToken = new Map<string, Opportunity[]>();
  for (const o of inflight) {
    const t = companyToken(o.company);
    (byToken.get(t) || byToken.set(t, []).get(t)!).push(o);
  }

  const since = new Date(Date.now() - (opts.sinceDays ?? 21) * 864e5);
  const client = new ImapFlow({ host, port: 993, secure: true, auth: { user, pass }, logger: false });
  let found = 0;

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch({ since }, { envelope: true, bodyParts: ["text"] })) {
        const env = msg.envelope;
        const from = env?.from?.[0];
        const fromAddr = (from?.address || "").toLowerCase();
        const fromName = from?.name || "";
        const subject = (env?.subject || "").toLowerCase();
        const domain = fromAddr.split("@")[1] || "";
        const hay = `${fromAddr} ${subject}`;

        for (const [token, opps] of byToken) {
          if (token.length < 3) continue;
          if (domain.includes(token) || hay.includes(token)) {
            for (const o of opps) {
              if (o.status === "replied") continue;
              o.status = "replied";
              o.contactEmail = o.contactEmail || fromAddr;
              o.contactNote = `↩ replied ${env?.date ? new Date(env.date).toISOString().slice(0, 10) : ""}: "${(env?.subject || "").slice(0, 80)}"`;
              o.letter = draftReply(o, fromName); // repurpose letter slot as the drafted reply
              found++;
            }
          }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
  return found;
}
