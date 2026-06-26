# ViewLoom audit records

## Completed P9H0 History baseline

P9H0 completed through PR #430.

- `history-ui-h0-baseline.md`
- `history-ui-h0-owner-map.json`
- `history-ui-h0-source-map.md`
- `history-ui-h0-findings.md`
- `../../apps/web/scripts/history-ui-h0-browser.mjs`
- `../../scripts/verify-history-ui-h0-baseline.mjs`
- `../../.github/workflows/history-ui-h0-baseline.yml`

The deterministic baseline locks stale metric context and the long mobile task flow before repair. The local keyboard result differs from the P8B production observation and remains a P9H5/final-acceptance discrepancy.

## Completed P8B public browser audit

P8B completed through PR #428 and remains the browser baseline for Phase 9–11.

- `P8B_SCOPE.md`
- `public-browser-defects.json`
- `public-browser-audit.md`
- `../../apps/web/scripts/public-browser-audit.mjs`
- `../../scripts/verify-public-browser-audit.mjs`
- `../../.github/workflows/public-browser-audit.yml`

Executed scope:

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing-surface probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

P8B was audit-only and did not change UI, APIs, D1, bindings, collectors, cron, retention, output schemas, provider separation, or Preview behavior.

## Completed P8A public-surface inventory

- `public-surface-inventory.md`
- `public-surface-inventory.json`
- `public-surface-routes-*.json`
- `public-surface-profiles-*.json`
- `public-surface-gaps.json`
- `public-surface-schema-note.md`
- `P8A_SCOPE.md`

Validation:

```text
node scripts/verify-public-surface-inventory.mjs
node scripts/verify-public-browser-audit.mjs
node scripts/verify-history-ui-h0-baseline.mjs
```

Current execution is governed by `../product/current-schedule.md`, not by a completed audit record.