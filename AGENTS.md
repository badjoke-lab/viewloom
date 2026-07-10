# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A legal/support public surface complete
R12B Stripe/support readiness complete through R12B-2
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete PR #485
R12C-2 launch/share asset package complete PR #486
R12C-3 candidate acceptance complete PR #487
R12C-3 exact production SHA closeout complete
Current phase: Phase 12A Analytics Capture Foundation
12A-0 current data and capacity baseline: complete PR #490
12A-1 analytics field contract: complete PR #492
12A-2 rollup design budget: accepted PR #494
12A-2 remote D1 size gate tooling: installed PR #495
Current workstream: 12A-2 remote D1 size gate blocked before migration
Current blocker: cloudflare_credentials_missing
Migration started: no
```

Permanent Phase 12A evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-remote-d1-size-evidence.json
docs/audits/12a2-current-gate-state.json
docs/product/analytics-field-contract-v1.md
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md
docs/operations/12a2-remote-d1-size-gate-blocked-2026-07-11.md
```

Accepted 12A-2 design:

```text
grain: provider x day x streamer
Twitch cap: 600 streamers/day
Kick cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention extension: no
Twitch safe projection: 70.99 MB
Kick safe projection: 23.57 MB
```

The current migration gate is blocked because the GitHub workflow environment does not expose `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The blocked evidence makes no current remote D1 size or headroom claim.

Resume order:

```text
make both repository secrets available
rerun Analytics 12A2 Remote D1 Size Gate on main
require observed evidence and migrationStorageGatePass=true
only then create work-analytics-12a2-migration
```

Do not start migration, compact-rollup generation, retention extension, a new high-frequency cron, category capture activation, exact-session claims, or cross-provider analytics while the remote-size blocker remains current.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
