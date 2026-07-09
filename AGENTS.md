# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A complete
R12B complete through R12B-2
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/operations/phase12-release-acceptance-2026-07-09.md
docs/audits/r12c3-candidate-acceptance.json
docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

Phase 12 production acceptance is bound to exact main SHA `32c27a9a772cb62ff38f009c5fd1bb095ac27ad8`, Production Smoke run `28993206779`, and independent closeout probe run `28993547481`.

Current Phase 12A authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/product/current-roadmap.md
docs/product/current-schedule.md
```

12A-0 is evidence-only baseline work. Record current D1/storage/query/cadence/capacity facts before schema migration or analytics runtime changes. Closeout capacity observations carried forward are Twitch 300/300 and Kick 100/100, both `at-or-over-window`.

These observations do not authorize collection-window expansion, raw-retention extension, provider combination, or stronger coverage claims.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Approved forward order is Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Do not start Phase 16 branches before Phase 15 entry gates close. Do not extend raw retention, add unsupported session/category claims, combine Twitch and Kick, or create ad hoc analytics features outside the approved specification and plan.
