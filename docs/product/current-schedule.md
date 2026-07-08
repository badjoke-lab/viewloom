# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-09

```text
Phase 8 complete PR #428
Phase 9 complete
U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12A implementation PR: #477
R12A production acceptance: pass
R12B-0 evidence and configuration audit complete PR #481
R12B-1 Support page and payment transition acceptance complete PR #482
R12B-2 refund/disclosure consistency acceptance complete PR #483
R12C-0 message inventory complete
Current workstream: R12C-1 launch copy and FAQ
Exact next implementation branch: work-release-r12c1-launch-copy-faq
Next branch created: no
```

## Phase 12 execution order

```text
R12A-0 current legal/support surface audit                 complete
R12A-1 shared legal/support page foundation                complete
R12A-2 Contact, Terms, Privacy                             complete
R12A-3 Refund Policy and Commercial Disclosure             complete
R12A-4 About/footer and route ownership integration        complete
R12A-5 candidate and hosted acceptance                     complete
R12B-0 evidence and configuration audit                    complete
R12B-1 Support page and payment transition                 complete
R12B-2 refund/disclosure consistency acceptance            complete
R12C-0 message inventory                                   complete
R12C-1 launch copy and FAQ                                 active
R12C-2 launch/share asset package                          queued
R12C-3 release candidate acceptance                        queued
```

## R12C-0 accepted inventory

Permanent evidence:

```text
docs/audits/r12c0-message-inventory.json
docs/audits/r12c0-message-inventory.md
docs/operations/r12c0-message-inventory-2026-07-09.md
```

Inventory completed:

```text
Portal/About source descriptions
provider-home descriptions
feature-role descriptions
coverage/retention/cadence boundaries
Twitch/Kick separation explanation
Status/help/support/legal route map
FAQ source material
terminology candidates
existing generic share asset
CI screenshot evidence source
R12C-1 message gaps
R12C-2 asset gaps
```

## R12C-1 execution boundary

Produce and integrate, as appropriate:

```text
one-line description
short listing description
long description
feature-role summary
coverage limitations
provider separation explanation
retention explanation
FAQ
Support/legal links
Status/help links
```

R12C-1 must use the R12C-0 inventory as its evidence boundary. It must not claim complete platform coverage, official analytics, unique viewers, exact creator revenue, exact session reconstruction, combined Twitch/Kick audience totals, or cross-platform rankings.

## Forward execution order after Phase 12

```text
1. Phase 12A Analytics Capture Foundation
2. Phase 13 localization
3. Phase 14 localization completion and acceptance
4. Phase 15 Analytics Capability and Calibration Audit
5. Phase 16A Baseline Engine
6. Phase 16B Anomaly Detection
7. Phase 16C Observed Run Intelligence
8. Phase 16D Category-relative Analysis
9. Phase 16E Co-movement and Relationship Analysis
10. Phase 16F Replay and Backtest
```

## Phase 12A schedule boundary

Phase 12A starts only after R12C-3 closes the full Phase 12 release acceptance.

```text
12A-0 current data and capacity baseline
12A-1 analytics field contract
12A-2 compact intraday rollup design and migration
12A-3 bounded intraday rollup generation
12A-4 provider-specific category capture foundation
12A-5 production acceptance and accumulation handoff
```

Capacity observations carried forward:

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

They are Phase 12A baseline inputs, not authorization to expand limits.

## Governing analytics documents

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`

Do not create Phase 12A or Phase 16 branches before their entry gates close. Do not bypass Phase 12A capture work with request-time long-window raw scans or unsupported session/category claims.
