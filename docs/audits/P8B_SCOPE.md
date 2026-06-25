# Phase 8 P8B — public browser defect audit

Status: active
Branch: `work-public-browser-audit`
Predecessor: PR #427
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

## Route groups

```text
Portal
Twitch Home
Kick Home
Twitch/Kick Heatmap
Twitch/Kick Day Flow
Twitch/Kick Battle Lines
Twitch/Kick History
Twitch/Kick Channel
Twitch/Kick Watchlist
Twitch/Kick Status
About
Support
Changelog
404
missing policy/disclosure routes
```

## Evidence package

```text
apps/web/scripts/public-browser-audit.mjs
.github/workflows/public-browser-audit.yml
scripts/verify-public-browser-audit.mjs
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
```

The workflow produces machine-readable runtime evidence and full-page screenshots as a GitHub Actions artifact.

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

- 21 owned surfaces are audited at all four required widths;
- missing policy/disclosure routes are probed;
- History required states and interactions are captured;
- every P0/P1 has exact reproduction, route, provider, viewport, state, owner, file, existing gate, and missing assertion;
- Twitch/Kick separation and bounded-coverage claims remain exact;
- a machine-readable defect ledger and human-readable report are committed;
- the ordered Phase 9 queue is explicit;
- latest-head CI passes;
- `work-history-ui-h0-baseline` is named as the exact next branch unless a P0 interrupts;
- no product repair is mixed into this PR.
