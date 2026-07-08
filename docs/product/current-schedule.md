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
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete
Current workstream: R12C-2 launch/share asset package
Exact next implementation branch: work-release-r12c2-launch-assets
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
R12C-1 launch copy and FAQ                                 complete
R12C-2 launch/share asset package                          active
R12C-3 release candidate acceptance                        queued
```

## R12C-1 accepted package

Permanent evidence:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md
```

Package includes:

```text
one-line description
short listing description
long description
seven-role feature summary
coverage limitations
plain-language Kick candidate explanation
provider separation explanation
5-minute cadence explanation
up-to-180-day daily rollup explanation
12-question FAQ
Status/help links
Support/legal links
terminology contract
R12C-2 handoff
```

## R12C-2 execution boundary

Produce a curated launch/share package from current product surfaces.

Required:

```text
current desktop product screenshot
current mobile product screenshot
representative Heatmap screenshot
representative Day Flow screenshot
representative Battle Lines screenshot
representative History screenshot
asset manifest with source route
asset manifest with viewport
asset manifest with capture date
asset manifest with intended external use
captions bounded by R12C-1 copy
```

The generic `apps/web/public/og/viewloom.svg` remains usable as an identity card but does not replace representative product screenshots. CI Public Browser screenshots remain evidence artifacts until deliberately curated into the R12C-2 package.

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
