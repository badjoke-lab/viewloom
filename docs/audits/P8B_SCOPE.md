# Phase 8 P8B — public browser defect audit

Status: completed through PR #428
Branch: `work-public-browser-audit`
Predecessor: PR #427
Completion PR: #428
Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`
Roadmap phase: completed Phase 8
Handoff branch: `work-history-ui-h0-baseline`

## Purpose

P8B converted the static P8A route/ownership inventory into exact browser evidence and an ordered defect ledger. It is now a permanent historical baseline for Phase 9–11.

## Executed matrix

```text
21 owned routes
4 required viewports: 1440 / 820 / 390 / 360
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

Verified evidence head:

```text
75bc7f22e015edfe004158746796081a3719219b
```

Verified workflow/artifact:

```text
run 28203107250
artifact 7892012367
sha256:793d2c70f24d0a1056767d1c59056b2b2884b03c25177d70c65ab506d18a268b
```

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
- owned routes returned expected 200 or explicit 404;
- deterministic History charts exposed numeric Y labels, date labels, and day controls;
- History task switching did not refetch data;
- Back restored the previous Archives state and Forward restored Report;
- all required degraded History states were captured.

## Boundary

P8B was audit-only. It did not repair public UI, change APIs, alter D1, modify bindings, change collectors, add cron work, change retention, change output schemas, combine providers, or create a Cloudflare Preview.

This record must not be edited to describe active Phase 9 implementation. Phase 9 uses it as historical evidence.

## Completion criteria

- 21 owned surfaces audited at all four required widths — complete;
- missing policy/disclosure routes probed — complete;
- History required states/interactions captured — complete;
- every P0/P1 has exact reproduction/ownership/gate data — complete;
- provider separation and bounded-coverage claims preserved — complete;
- machine-readable ledger and human report committed — complete;
- ordered Phase 9 queue explicit — complete;
- latest-head CI passed — complete;
- no product repair mixed into P8B — complete;
- PR #428 merged and merge report issued — complete;
- explicit continuation to P9H0 received — complete.

Current execution authority is `docs/product/current-schedule.md`, not this completed audit scope.