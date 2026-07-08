# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
U10H production acceptance complete PR #471
U10H canonical closeout complete PR #472
Phase 11 P11A–P11F complete
Phase 11 P11G candidate merged PR #473
Phase 11 production closeout complete
Phase 12 English release readiness active
Current workstream: R12A-5 candidate and hosted acceptance
Active implementation branch: work-release-r12a-legal-support
Branch created: yes
Candidate public HTML routes: 25
Candidate browser scenarios: 100
Hosted production acceptance: pending merge
```

Permanent Phase 11 closeout: `docs/operations/phase11-production-closeout-2026-07-08.md`.

Active Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
docs/audits/phase12-r12a-legal-support-baseline.json
```

Phase 12 sequence is R12A legal/support surface completion, R12B Stripe/support-flow readiness, and R12C English launch package/release acceptance.

R12A-0 through R12A-4 are complete on the candidate branch. R12A-5 owns latest-head candidate gates, merge, exact production SHA verification, 25-route Production Smoke, provider status/monitoring checks, explicit 404 behavior, and final candidate-to-resolved gap transition. The five legal/support routes must not be marked resolved before hosted production evidence passes.

External Stripe dashboard/account state must not be inferred from repository files alone.

Approved future analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Approved forward order is Phase 12 release readiness, Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Do not start Phase 12A or Phase 16 branches before their entry gates close. Do not extend raw retention, add unsupported session/category claims, combine Twitch and Kick, or create ad hoc analytics features outside the approved specification and plan.
