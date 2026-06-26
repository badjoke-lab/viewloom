# Phase 8 P8B — public browser defect audit

Status: complete through PR #428
Branch: `work-public-browser-audit`
Predecessor: PR #427
Completion PR: #428
Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`
Handoff: P9H0 completed through PR #430

## Purpose

P8B converted the static P8A route/ownership inventory into browser evidence and an ordered defect ledger. It is a permanent historical baseline for Phase 9–11.

## Executed matrix

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History state/interaction scenarios
```

## Result

```text
P0 0
P1 3
P2 5
P3 0
```

P1 defects:

- History metric synchronization;
- History first keyboard-focus entry;
- History desktop/mobile task hierarchy.

P2 findings:

- shared mobile target sizes;
- Watchlist omission from Public Readiness;
- general Production Smoke omissions;
- missing Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes;
- Day Flow date control accessible name.

Exact reproduction, owners, files, current gates, missing assertions, evidence files, and ordered repair queue remain in `public-browser-defects.json` and `public-browser-audit.md`.

## Evidence package

```text
apps/web/scripts/public-browser-audit.mjs
.github/workflows/public-browser-audit.yml
scripts/verify-public-browser-audit.mjs
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

## Verified invariants

- no P0 was found;
- no Twitch/Kick provider crossing was found;
- no page-level horizontal overflow was found over the audit threshold;
- owned routes returned the expected 200 or explicit 404;
- deterministic History charts exposed numeric labels, date labels, and day controls;
- History task switching did not refetch;
- Back/Forward restored the expected task state;
- degraded History states were captured.

## Boundary

P8B was audit-only. It did not repair UI or change APIs, D1, bindings, collectors, cron, retention, output schemas, provider separation, or Preview behavior.

Current execution is governed by `docs/product/current-schedule.md`. Do not treat this completed audit as the active branch.