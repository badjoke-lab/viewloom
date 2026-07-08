# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal/support public surface complete
R12A implementation merged PR #477
R12A production acceptance pass
Current workstream: R12B-0 evidence and configuration audit
Exact next implementation branch: work-release-r12b-stripe-support-flow
Next branch created: no
```

Permanent R12A evidence:

```text
docs/audits/phase12-r12a-legal-support-baseline.json
docs/audits/r12a-production-acceptance.json
docs/operations/r12a-production-acceptance-2026-07-08.md
```

Active Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Phase 12 sequence is R12A complete, R12B active, and R12C queued.

R12B begins with evidence separation between repository facts, hosted public behavior, and external Stripe dashboard/account facts. External Stripe registration, account state, Payment Link dashboard settings, and refund configuration must not be inferred from repository files alone.

Approved future analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Approved forward order is Phase 12 release readiness, Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Do not start Phase 12A or Phase 16 branches before their entry gates close. Do not extend raw retention, add unsupported session/category claims, combine Twitch and Kick, or create ad hoc analytics features outside the approved specification and plan.
