# ViewLoom Launch Snapshot / Handoff

This document freezes the current launch-preparation state after the readiness gate was added.

## Current baseline

- Latest merged PR: #308 `Add readiness gate`
- Latest main merge commit: `2c13197bab62ae3678eed0db48879e3da0eb7fec`
- Web verification, Web build, and Web checks were green before #308 was merged.

## Public page inventory

The public web surface currently consists of 15 pages:

- `/`
- `/about/`
- `/support/`
- `/twitch/`
- `/twitch/heatmap/`
- `/twitch/day-flow/`
- `/twitch/battle-lines/`
- `/twitch/history/`
- `/twitch/status/`
- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`
- `/kick/history/`
- `/kick/status/`

## Live feature entries

The live-connected feature pages are intentionally separated by renderer entry:

- Heatmap: `/src/live/heatmap-current-shell-entry.ts`
- Day Flow: `/src/live/day-flow-current-shell-entry.ts`
- Battle Lines: `/src/live/battle-lines-current-shell-entry.ts`
- History: `/src/live/history-current-shell-entry.ts`
- Status: `/src/live/status-current-shell-entry.ts`

No feature page should return to static SVG-only mocks, `Stream A` demo rows, fake live numbers, or hard-coded freshness.

## Active QA gates

`Web verification` runs these gates from `apps/web`:

- `scripts/verify-production-source.mjs`
- `scripts/verify-heatmap-qa.mjs`
- `scripts/verify-dayflow-qa.mjs`
- `scripts/verify-battle-lines-qa.mjs`
- `scripts/verify-history-qa.mjs`
- `scripts/verify-status-qa.mjs`
- `scripts/verify-home-qa.mjs`
- `scripts/verify-content-qa.mjs`
- `scripts/verify-seo-qa.mjs`
- `scripts/verify-mobile-qa.mjs`
- `scripts/verify-state-qa.mjs`
- `scripts/verify-launch-readiness.mjs`

## Verification artifacts

`Web verification` uploads one artifact named `web-verification-logs`.

It should contain:

- `source-gate.log`
- `heatmap-qa.log`
- `dayflow-qa.log`
- `battle-lines-qa.log`
- `history-qa.log`
- `status-qa.log`
- `home-qa.log`
- `content-qa.log`
- `seo-qa.log`
- `mobile-qa.log`
- `state-qa.log`
- `launch-readiness.log`

## Next PR schedule

Do not mix these into one PR.

1. PR-27 Deep Link
2. PR-28 Copyable Reports
3. PR-29 History additional rankings
4. PR-30 Compare Periods
5. PR-31 Watchlist Lite
6. PR-32 Channel Index
7. PR-33 Channel Pages
8. PR-34 Search
9. PR-35 Export
10. PR-36 Page-local Alerts
11. Data Lane
12. Kick coverage refinement

## Rules for future work

- One PR should change one feature or one verification axis.
- Every feature PR should include a matching QA gate or extend an existing gate.
- Web verification, Web build, and Web checks must pass before merge.
- Empty, unavailable, and error states must be explicit.
- Twitch and Kick must remain separated unless a page explicitly explains both providers.
- Cloudflare Free operation remains the constraint.
