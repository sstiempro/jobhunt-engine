#!/bin/bash
# Production runtime wrapper for the Jobhunt Engine (invoked by launchd on a schedule).
# Keeps the Leadboard fresh and runs reply-watch if GMAIL_* env is configured.
set -uo pipefail

export PATH="/Users/digitaloutbreak/.local/bin:/usr/local/bin:/usr/bin:/bin"
ENGINE="/Users/digitaloutbreak/Developer/job-search/jobhunt-engine"
LOG="$ENGINE/data/cron.log"

cd "$ENGINE" || exit 1
mkdir -p data

# keep the log from growing unbounded (tail last ~2000 lines)
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 2000 ]; then
  tail -n 1000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

echo "" >> "$LOG"
echo "========== jobhunt run $(date '+%Y-%m-%d %H:%M:%S %Z') ==========" >> "$LOG"
npm run run >> "$LOG" 2>&1
echo "========== done $(date '+%Y-%m-%d %H:%M:%S %Z') ==========" >> "$LOG"
