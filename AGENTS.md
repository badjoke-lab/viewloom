# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal/support public surface complete
R12B Stripe/support readiness complete through R12B-2
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete PR #485
R12C-2 launch/share asset package complete PR #486
Current workstream: R12C-3 release candidate acceptance
Exact active implementation branch: work-release-r12c3-release-candidate-acceptance
Active branch created: yes
```

Active Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
docs/audits/r12c3-release-candidate-contract.json
```

Permanent R12C-1 source-language package:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md
```

Permanent R12C-2 launch/share package:

```text
apps/web/public/launch-assets/
docs/audits/r12c2-launch-assets-capture.json
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md
```

Phase 12 sequence is R12A complete, R12B complete, R12C-0 complete, R12C-1 complete, R12C-2 complete, and R12C-3 active.

R12C-3 owns final latest-head typecheck/build, public inventory/readiness/browser checks, responsive/accessibility gates, provider separation, legal/support direct links, outbound support/payment links, metadata/canonical/sitemap checks, deliberate hosted validation where required, and exact production SHA smoke after merge.

Candidate merge does not complete Phase 12. The exact merged `main` SHA must pass Production Smoke before permanent Phase 12 release acceptance is recorded and the temporary Phase 12 working note is retired.

R12B's external evidence boundary remains active: current Stripe Dashboard/account facts must not be inferred from repository files or public browser behavior alone.

Approved future analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Approved forward order is Phase 12 release readiness, Phase 12A Analytics Capture Foundation, Phase 13–14 localization with evidence accumulation, Phase 15 Analytics Capability and Calibration Audit, then Phase 16A–16F analytics implementation.

Do not start Phase 12A or Phase 16 branches before their entry gates close. Do not extend raw retention, add unsupported session/category claims, combine Twitch and Kick, or create ad hoc analytics features outside the approved specification and plan.
