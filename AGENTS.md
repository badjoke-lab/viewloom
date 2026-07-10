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
Current workstream: 12A-1 analytics field contract
Exact next implementation branch: work-analytics-12a1-field-contract
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Permanent 12A-0 baseline and closeout evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md
docs/operations/12a0-closeout-2026-07-10.md
```

Accepted 12A-0 capacity baseline:

```text
Twitch raw rows: 8,688
Twitch retained payload: 314.14 MB
Twitch estimated payload/day: 10.38 MB
Twitch rollup observed days: 74

Kick raw rows: 14,442
Kick retained payload: 232.96 MB
Kick estimated payload/day: 4.63 MB
Kick rollup observed days: 52

Latest 24h cadence: 287 / 288 for each provider
```

Active analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
```

12A-1 is a provider-specific analytics field-contract workstream. Define minimum fields for baseline, observed-run, and category work; classify Twitch `started_at` evidence strength; verify a Kick category source before category capture approval; version source contracts; and document provider differences without claiming identity equivalence.

No D1 migration is authorized in 12A-1. Do not add compact-rollup schema/runtime generation, analytics UI, raw-retention extension, a new high-frequency cron, exact-session claims, or cross-provider analytics.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Approved forward order is Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
