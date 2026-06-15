# ViewLoom Launch Snapshot / Handoff

This document freezes the current launch-preparation state after the Platform Home repair and Changelog foundation.

## Current baseline

- Latest merged PR: #340 `Add Changelog foundation`
- Latest main merge commit: `d2405906490c6573b1d837ea3bf91e7b929d0ca9`
- Platform Home PRs 1-4 are complete.
- Changelog foundation is complete; the public page UI is the current work item.
- Web verification, Web build, and Web checks were green before #340 was merged.

## Public page inventory

The public web surface consists of 16 pages after the Changelog page is added:

- `/`
- `/about/`
- `/support/`
- `/changelog/`
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
- Provider Home: `/src/provider-home.ts`
- Changelog: `/src/changelog-page.ts` reading `/data/changelog.json`

No feature page should return to static SVG-only mocks, `Stream A` demo rows, fake live numbers, or hard-coded freshness. The Changelog must not publish unreviewed detailed history.

## Active QA gates

`Web verification` runs these gates from `apps/web`:

- `scripts/verify-production-source.mjs`
- `scripts/verify-heatmap-qa.mjs`
- `scripts/verify-dayflow-qa.mjs`
- `scripts/verify-battle-lines-qa.mjs`
- `scripts/verify-history-qa.mjs`
- `scripts/verify-status-qa.mjs`
- `scripts/verify-home-qa.mjs`
- `scripts/verify-changelog-qa.mjs`
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
- `changelog-qa.log`
- `content-qa.log`
- `seo-qa.log`
- `mobile-qa.log`
- `state-qa.log`
- `launch-readiness.log`

## Next PR schedule

Do not mix these into one PR.

1. Changelog page UI
2. Changelog content review, approved backfill, and Provider Home connection
3. Deep Link
4. Copyable Reports
5. History additional rankings
6. Compare Periods
7. Watchlist Lite
8. Channel Index
9. Channel Pages
10. Search
11. Export
12. Page-local Alerts
13. Data Lane
14. Kick coverage refinement

## Rules for future work

- One PR should change one feature or one verification axis.
- Every feature PR should include a matching QA gate or extend an existing gate.
- Web verification, Web build, and Web checks must pass before merge.
- Empty, unavailable, and error states must be explicit.
- Twitch and Kick must remain separated unless a page explicitly explains both providers.
- Changelog detail remains private until reviewed and approved.
- Cloudflare Free operation remains the constraint.
