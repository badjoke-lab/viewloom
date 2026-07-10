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
Current workstream: 12A-2 compact intraday rollup design and migration
Exact next implementation branch: work-analytics-12a2-intraday-rollup-design
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Permanent Phase 12A evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/product/analytics-field-contract-v1.md
docs/operations/12a1-field-contract-acceptance-2026-07-10.md
docs/operations/12a1-closeout-2026-07-10.md
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

Accepted 12A-1 contract boundaries:

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider identity equivalence: prohibited
```

12A-2 must design provider-separated compact intraday storage for 90-day baseline capability without extending raw retention. Before migration is approved, estimate and accept rows/day, bytes/row, bytes/day, retained rows, retained size, index cost, query plan/timing target, refresh scope, retention policy, and failure visibility for Twitch and Kick separately.

12A-2 must not perform migration before budget acceptance. Do not extend raw retention, add a high-frequency cron by default, activate category capture, claim exact sessions, or combine providers.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Approved forward order is Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
