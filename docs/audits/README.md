# ViewLoom audit records

## Completed Phase 8 P8A public-surface inventory

- [`public-surface-inventory.md`](public-surface-inventory.md) — human-readable P8A findings and P8B handoff
- [`public-surface-inventory.json`](public-surface-inventory.json) — canonical machine-readable inventory manifest
- `public-surface-routes-*.json` — Portal, Twitch, and Kick route records
- `public-surface-profiles-*.json` — shared owner, control, state, gate, assessment, and gap profiles
- [`public-surface-gaps.json`](public-surface-gaps.json) — missing surfaces and cross-route acceptance gaps
- [`public-surface-schema-note.md`](public-surface-schema-note.md) — normalized package structure
- [`P8A_SCOPE.md`](P8A_SCOPE.md) — completed no-repair boundary and exact P8B handoff

Validation:

```text
node scripts/verify-public-surface-inventory.mjs
```

The inventory package records current repository evidence. It does not claim that an interaction works merely because a page builds or an older workflow exists.

P8B must treat these files as its route, ownership, provider-binding, and existing-gate baseline. Browser evidence may add or refine defect classification, but inventory changes must update the machine-readable package and verifier.
