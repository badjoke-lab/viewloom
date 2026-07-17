# 12A-4-12 Kick category capture canary post-rollback read-only acceptance

## Status

Accepted.

- final workflow run: `29488056134`
- final workflow job: `87822408236`
- final sanitized artifact: `8399137444`
- observed at: `2026-07-17T06:41:08.710Z`
- frozen evidence: `docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-evidence.json`

## Result

The bounded Kick category canary ended and the normal Kick collector resumed with no permanent category enablement.

Accepted evidence:

- attempt-3 window expired at `2026-07-17T03:45:00.000Z`;
- all bounded canary bindings absent;
- direct permanent `CATEGORY_CAPTURE_ENABLED` absent;
- required D1 tables present;
- Kick category dictionary rows: `164`;
- category-bearing payload rows inside the bounded window: `288`;
- category-bearing payload rows after the ten-minute grace boundary: `0`;
- provider leakage rows: `0`;
- latest normal Kick snapshot: `2026-07-17T06:40:00.000Z`;
- latest normal snapshot source: `authenticated`;
- latest normal snapshot streams/viewers: `100` / `239,409`;
- freshness at acceptance: `0.33` minutes;
- D1 current/projected/headroom: `295.47 MB` / `317.48 MB` / `132.52 MB`.

All read-only acceptance gates passed.

## Focused rollback recovery

The first post-expiry acceptance artifact `8398761959` rejected one gate only: stale attempt-3 canary bindings remained in Worker settings even though normal authenticated snapshots continued and category writes had stopped.

The focused recovery was therefore restricted to deploying the canonical normal Kick configuration:

- cleanup package PR: #586, merge `aaafab2266ef717b2e51dd5006044578bbfd8ae2`;
- exact one-file cleanup trigger PR: #587, merge `7fbc343207de235ae583e827ba2fa7796083faf4`;
- deployed configuration: `workers/collector-kick/wrangler.toml` only;
- manual collection: none;
- migration/backfill/retention/cadence changes: none;
- Twitch change: none.

## Read-only boundary

The final acceptance probe used only:

- Cloudflare API `GET`;
- D1 `SELECT`;
- no Worker deployment or deletion;
- no trigger or gate mutation;
- no category writes;
- no Twitch authorization.

## Handoff

The cleanup trigger and production cleanup path are retired by the canonical acceptance update.

Kick final observation and rollback are accepted. A Twitch canary is not started or automatically authorized by this evidence. Any Twitch work requires a separate package, trigger, and acceptance sequence.
