# ViewLoom audit records

## Active Phase 8 P8B public browser defect audit

P8B runtime execution and defect classification are complete on the active completion branch. Latest-head gates and PR #428 merge remain.

- [`P8B_SCOPE.md`](P8B_SCOPE.md) — audit boundary, executed matrix, result, and completion criteria
- [`public-browser-defects.json`](public-browser-defects.json) — canonical machine-readable defect ledger and ordered queue
- [`public-browser-audit.md`](public-browser-audit.md) — human-readable audit report
- [`../../apps/web/scripts/public-browser-audit.mjs`](../../apps/web/scripts/public-browser-audit.mjs) — browser evidence generator
- [`../../scripts/verify-public-browser-audit.mjs`](../../scripts/verify-public-browser-audit.mjs) — repository-side P8B verifier
- [`../../.github/workflows/public-browser-audit.yml`](../../.github/workflows/public-browser-audit.yml) — latest-head CI and artifact workflow

P8B completion package:

```text
public-browser-defects.json
public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

Executed scope:

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing-surface probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

P8B is audit-only. It does not silently repair UI or change API, D1, binding, collector, cron, retention, output-schema, provider-separation, or Preview behavior.

## Completed Phase 8 P8A public-surface inventory

- [`public-surface-inventory.md`](public-surface-inventory.md) — human-readable findings and P8B handoff
- [`public-surface-inventory.json`](public-surface-inventory.json) — canonical machine-readable manifest
- `public-surface-routes-*.json` — Portal, Twitch, and Kick route records
- `public-surface-profiles-*.json` — shared owner, control, state, gate, assessment, and gap profiles
- [`public-surface-gaps.json`](public-surface-gaps.json) — missing surfaces and cross-route acceptance gaps
- [`public-surface-schema-note.md`](public-surface-schema-note.md) — normalized package structure
- [`P8A_SCOPE.md`](P8A_SCOPE.md) — completed static-inventory boundary

Validation:

```text
node scripts/verify-public-surface-inventory.mjs
node scripts/verify-public-browser-audit.mjs
```

The P8A package records repository presence, owners, bindings, and known gate gaps. It does not claim that an interaction works merely because a page builds or an older workflow exists.

P8B treats P8A as its static baseline. Browser evidence adds classification without silently rewriting inventory history.
