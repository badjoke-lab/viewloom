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
R12B-2 refund/disclosure consistency acceptance complete
Current workstream: R12C-0 message inventory
Exact next implementation branch: work-release-r12c0-message-inventory
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
R12C-0 message inventory                                   active
R12C-1 launch copy and FAQ                                 queued
R12C-2 launch/share asset package                          queued
R12C-3 release candidate acceptance                        queued
```

## R12B accepted evidence

```text
R12B-0 PR: #481
R12B-0 merge SHA: dcdedebc1e491c3dbab95149d1a46c38b6d2aeae
R12B-0 hosted workflow: 28962351393
R12B-1 PR: #482
R12B-1 merge SHA: 1bcc9590f4ca04202a8155e8d10862f91d73cc7f
R12B-1 workflow: 28963037083
R12B-2 workflow: 28963522407
R12B-2 artifact: 8177066249
R12B-2 result: pass
```

R12B evidence keeps repository facts, hosted public behavior, historical correspondence, and current Stripe Dashboard/account facts separate. Unproven current external state remains explicitly pending.

## R12C-0 execution boundary

Collect and normalize the current English public-message inventory before writing launch copy.

Required inventory:

```text
Portal product description
About purpose and methodology wording
feature-role descriptions
bounded-data and coverage limitations
Twitch/Kick separation explanation
Status and methodology/help links
Support and legal links
current FAQ-like explanations
available public screenshots and share assets
missing launch explanations and assets
approved terminology candidates
```

R12C-0 does not authorize broad copy rewrites. It produces the evidence inventory for R12C-1.

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
