# ViewLoom audit records

## Active public-surface audit

- [`public-surface-inventory.md`](public-surface-inventory.md) — human-readable Phase 8 P8A findings and P8B handoff
- [`public-surface-inventory.json`](public-surface-inventory.json) — canonical machine-readable inventory manifest
- `public-surface-routes-*.json` — portal, Twitch, and Kick route records
- `public-surface-profiles-*.json` — shared owner, control, state, and acceptance profiles
- [`public-surface-gaps.json`](public-surface-gaps.json) — missing surfaces and cross-route acceptance gaps

Validation:

```text
node scripts/verify-public-surface-inventory.mjs
```

The inventory package records current repository evidence. It does not claim that an interaction works merely because a page builds or an older workflow exists.
