# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-20

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Kick provider-specific bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- Twitch bounded canary, rollback, post-expiry acceptance, and production-path retirement.
- 12A-4-19 permanent category product and operational decision: Twitch-first, provider-separated rollout.
- 12A-4-20 Twitch permanent-category implementation package, rollback config, read-only observer, fixtures, typecheck, and dry-run bundle acceptance.
- 12A-4-21 dormant Twitch release package with exact-trigger validation, fresh preflight ordering, initial snapshot verification, and automatic restoration acceptance.

### Current gate: 12A-4-21 Twitch release package accepted, exact trigger pending

The Twitch permanent-category implementation and dormant release package are accepted. The release workflow is present, but the exact one-file trigger is absent and runtime category capture remains inactive.

Kick remains unauthorized and unchanged. The normal category-disabled Twitch configuration remains the active production and rollback configuration.

### Current action: exact Twitch release trigger

Create one separate trigger file pinned to the accepted release-package merge SHA and a start boundary inside the three-hour runner limit. The main workflow must run the fresh Cloudflare GET / D1 SELECT preflight before any release, stop on a failed gate, verify two consecutive real non-empty category-bearing snapshots after release, and restore the normal config automatically on failure.

### Following gates

1. 12A-4-22 minimum 24-hour observation, extended to 48 hours on warning.
2. 12A-4-23 Twitch acceptance or rollback closeout.
3. 12A-4-24 separate Kick decision.
4. 12A-5 seven-day stable accumulation followed by provider-specific category UI.

## Hard boundaries

- Twitch implementation and release packages are accepted; Twitch runtime capture is not active yet.
- Kick permanent category capture is not authorized.
- Twitch and Kick remain separate data products and databases.
- Cross-provider category identity and combined category rankings are not allowed.
- No new Worker schedule, backfill, or raw-retention expansion is authorized.
- Category analytics UI remains deferred until stable accumulation gates pass.
- Free-tier safety, fresh preflight, two-snapshot verification, and tested restoration take precedence over feature breadth.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json`
- `docs/audits/12a4-twitch-permanent-category-release-contract.json`
- `docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json`
- `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
