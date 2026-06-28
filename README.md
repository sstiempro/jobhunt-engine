# Jobhunt Engine

Keyless job-discovery + fit-scoring + tailored-draft + Leadboard funnel.
**The machine does the grind (find → score → draft → queue → track); you do the identity-click (press Send).**
See [`../JOBHUNT-ENGINE.md`](../JOBHUNT-ENGINE.md) for the full design + the honest division of labor.

## Run it

```bash
cd jobhunt-engine
npm install          # one-time (just tsx + typescript; zero runtime deps)
npm run run          # fetch everything → score → draft → build dashboard
open data/dashboard.html
```

Then work the board top-down: **Open ↗** the role, **Copy letter** / **Copy opener**, paste, submit. Set each card's status (saved in your browser).

## Commands

| command | what |
|---|---|
| `npm run run` | full pass: fetch → score → **find contacts** → draft (fit ≥ 55) → **reply-watch** → dashboard |
| `npm run fetch` | pull sources into the DB only |
| `npm run score` | re-score everything |
| `npm run draft` | (re)draft letters/openers for high-fit roles |
| `npm run dashboard` | rebuild `data/dashboard.html` |
| `npm run replies` | poll your inbox → flip applied roles to `replied` + draft a response (needs `GMAIL_*` env) |
| `npm run pipeline` | print the funnel + your live conversations |
| `npm run list -- --min 70` | print top roles in the terminal |

## Contact finder (keyless, warm)

On HN "Who is hiring?" the poster is usually the founder/hiring manager, and their public HN
profile often lists an email. The engine reads it via the official keyless HN API and attaches a
real contact + an **Email ↗** button (mailto, opener pre-filled) to those cards. LinkedIn people
are not scraped — you network there manually; the engine drafts the opener.

## Reply-watch — the "who messaged back" handoff

`npm run replies` polls your inbox, matches inbound mail to applications you've marked
`applied`/`sent`, flips them to `replied`, and drafts your response. From `replied` on, it's you in
the conversation. **It reads your mailbox, so it needs your credential — which only you supply:**

```bash
# 1) Gmail → create an App Password: https://myaccount.google.com/apppasswords
# 2) export the two values in your shell (the engine never stores or prints them)
export GMAIL_USER="you@gmail.com"
export GMAIL_APP_PASSWORD="xxxxxxxxxxxxxxxx"
# 3) install the optional IMAP client
npm i imapflow
npm run replies
```

Until you do this, reply-watch is a clean no-op (everything else runs normally).

## Production runtime (scheduled, always-on)

A launchd agent refreshes the board automatically (every 12h, + once on load):

```bash
cp com.sstiem.jobhunt.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.sstiem.jobhunt.plist   # starts immediately
launchctl list | grep jobhunt                                       # confirm it's registered
tail -f data/cron.log                                               # watch runs
launchctl unload ~/Library/LaunchAgents/com.sstiem.jobhunt.plist    # stop it
```

It runs `scripts/run.sh` (logs to `data/cron.log`, auto-trims). If you've exported `GMAIL_*` in
your login environment, scheduled runs include reply-watch too.

## Sources (all keyless / ToS-safe, verified live 2026-06-28)

- **HN "Who is hiring?"** — official Algolia HN API (founder-direct, your best channel)
- **Remotive** + **RemoteOK** — public remote-job APIs (we link back + credit Remotive, per their notice)
- **ATS watchlist** — Greenhouse / Lever / Ashby official public board endpoints. Add target companies in [`src/watchlist.ts`](src/watchlist.ts) (unknown slugs just return 0 — can't break a run).

LinkedIn / Wellfound / Indeed are intentionally **not** scraped (ToS + ban risk). The engine queues the draft; you browse + click there.

## Tuning the fit

Everything the scorer cares about lives in [`src/profile.ts`](src/profile.ts) — strong-stack / AI / quant keyword sets, role-title boosts, non-IC penalties, honest-gap signals, and the lead-project mapping. Edit those to retune.

## What stays your click

Account creation, the final **Submit / Send / Connect**, and every real conversation once someone replies. The engine makes each one fast and only surfaces the warm ones.

## Notes

- Pure Node (native `fetch`) + tsx. Data persists to `data/db.json` (re-runs never clobber a status/letter you've already set).
- Re-run daily (or wire it to `cron` / `launchd`) to keep the board fresh.
