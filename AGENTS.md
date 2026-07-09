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
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-capacity-baseline
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Accepted production identity:

```text
main/deployed SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
HTML routes: 25
status APIs: 2
sitemap URLs: 21
launch assets: 6
blocking alerts: 0
```

Active analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/phase12-release-acceptance.json
```

12A-0 is evidence-only. It must record current D1 row counts, payload size, oldest/latest raw bucket, daily-rollup counts, collector duration, relevant query timings, Twitch/Kick source modes and coverage behavior, five-minute cadence and retention behavior, current field matrix, and upstream fields discarded before storage.

No runtime change is allowed in 12A-0. Do not add a migration, new analytics UI, raw-retention extension, new high-frequency cron, unsupported session/category claim, or cross-provider analytics.

Current capacity baseline inputs:

```text
Twitch: at-or-over-window, 300 / 300, hasMore true
Kick:   at-or-over-window, 100 / 100
```

These are evidence inputs, not authorization to expand limits.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Approved forward order is Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Twitch and Kick remain separate across routes, APIs, bindings, storage, identities, coverage models, baselines, relationships, reports, exports, and claims.
