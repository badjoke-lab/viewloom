# Public surface inventory schema note

The inventory is normalized to avoid repeating shared controls, states, owner modules, and acceptance gates for Twitch and Kick route pairs.

```text
public-surface-inventory.json        root manifest
public-surface-routes-*.json         route-specific metadata, APIs, and bindings
public-surface-profiles-*.json       shared owners, controls, states, gates, assessments, and gaps
public-surface-gaps.json             absent routes and cross-route coverage gaps
```

`verify-public-surface-inventory.mjs` resolves the package and rejects missing sources, unknown profiles or gates, metadata drift, sitemap drift, provider-binding leakage, missing History P1 classification, or missing P8B handoff.
