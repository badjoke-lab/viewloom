# Phase 8 P8B — public browser defect audit

Status: active completion branch; runtime execution complete
Branch: `work-public-browser-audit`
Predecessor: PR #427
Completion PR: #428
Roadmap phase: Phase 8 — all-public-surface inventory and browser defect audit
Exact next branch after completion: `work-history-ui-h0-baseline` unless a newly discovered P0 interrupts

## Purpose

P8B converts the static P8A route and ownership inventory into exact browser evidence and an ordered defect ledger.

It audits repository-owned public routes at:

```text
1440px
820px
390px
360px
```

It also records required data states where applicable:

```text
real/fresh
partial
stale
empty
missing
demo
error
loading
in progress
storage unavailable
long content
```

## Executed matrix

```text
21 owned routes
4 required viewports
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History state and interaction scenarios
```

## Evidence package

```text
apps/web/scripts/public-browser-audit.mjs
.github/workflows/public-browser-audit.yml
scripts/verify-public-browser-audit.mjs
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

The workflow produces machine-readable runtime evidence, full-page screenshots, a browser audit log, and a local preview log.

## Result

```text
P0  0
P1  3
P2  5
P3  0
```

P1 defects:

- History metric synchronization;
- History first keyboard-focus entry;
- History desktop/mobile task hierarchy.

P2 findings:

- shared mobile target sizes;
- Watchlist omission from general Public Readiness;
- general Production Smoke route omissions;
- missing Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes;
- Day Flow date control accessible name.

The exact reproduction records, owners, files, current gates, missing assertions, evidence filenames, and ordered queue are in `public-browser-defects.json`.

## Verified invariants

- no P0 was found;
- no Twitch/Kick provider-crossing request was found;
- no horizontal page overflow was found over the audit threshold;
- owned routes returned the expected 200 or explicit 404;
- deterministic History charts exposed numeric Y labels, date labels, and day controls;
- History task switching did not refetch data;
- one Back restores the previous Archives state and one Forward restores Report;
- all degraded History states were captured.

## Required checks

- route status, title, canonical, robots, H1, and entry rendering;
- horizontal overflow at every required viewport;
- keyboard focus entry;
- accessible names on button-like controls;
- mobile target-size evidence;
- provider-specific API requests and provider-crossing detection;
- History metric switching, chart meaning, summary, selected day, task navigation, archive navigation, report view, Back, Forward, and request reuse;
- deterministic History partial, stale, empty, missing, demo, in-progress, error, and loading states;
- missing Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes;
- existing acceptance-gate gaps inherited from P8A.

## Defect classes

```text
P0  production outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, automation, or secondary interaction defect
P3  deferred improvement or feature request
```

The approved History defects remain P1 without another approval gate.

## Boundary

P8B is an audit branch.

It does not repair public UI, change APIs, alter D1, modify bindings, change collectors, add cron work, change retention, change output schemas, combine providers, or create a Cloudflare Preview.

A P0 may be isolated immediately only when the audit proves a production outage, materially wrong data, or provider/privacy failure. Otherwise all repairs move to the ordered Phase 9 queue.

## Completion criteria

- 21 owned surfaces are audited at all four required widths — complete;
- missing policy/disclosure routes are probed — complete;
- History required states and interactions are captured — complete;
- every P0/P1 has exact reproduction, route, provider, viewport, state, owner, file, existing gate, and missing assertion — complete;
- Twitch/Kick separation and bounded-coverage claims remain exact — complete;
- a machine-readable defect ledger and human-readable report are committed — complete;
- the ordered Phase 9 queue is explicit — complete;
- latest-head CI passes — pending final completion head;
- `work-history-ui-h0-baseline` is named as the exact next branch unless a P0 interrupts — complete;
- no product repair is mixed into this PR — complete.

After PR #428 merges, issue the full merge report and stop. Do not create `work-history-ui-h0-baseline` until explicit continuation.
