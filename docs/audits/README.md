# ViewLoom audit records

## Active Phase 8 P8B public browser defect audit

- [`P8B_SCOPE.md`](P8B_SCOPE.md) — active route, viewport, state, classification, and no-repair boundary
- [`../../apps/web/scripts/public-browser-audit.mjs`](../../apps/web/scripts/public-browser-audit.mjs) — browser evidence generator
- [`../../scripts/verify-public-browser-audit.mjs`](../../scripts/verify-public-browser-audit.mjs) — repository-side P8B verifier
- [`../../.github/workflows/public-browser-audit.yml`](../../.github/workflows/public-browser-audit.yml) — latest-head CI and artifact workflow

Required before P8B completion:

```text
public-browser-defects.json
public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

P8B audits 21 owned routes at 1440, 820, 390, and 360px, probes five missing policy/disclosure routes, and captures ten deterministic History state/interaction scenarios.

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

P8B treats P8A as its static baseline. Browser evidence may add classification, but inventory changes must update the machine-readable package and verifier.
