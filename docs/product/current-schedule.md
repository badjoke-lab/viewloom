# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-08

```text
Phase 12A-5B-R2 Twitch Heatmap category public cutover
Historical canonical baseline viewloom-12a2-current-gate-state-v33
Final seven-day audit accepted PR #736
Final-mode decision accepted PR #737
Hidden production revalidation accepted PR #739
Current gate Twitch-only public cutover
Default Category All categories
Default Top 50
Allowed Top 20 / 50 / 100
Public Twitch category-filter exposure authorized yes for this cutover
Kick category UI authorized no
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Accepted evidence

- Final read-only audit: `2016 / 2016` expected slots, coverage `1.0`, missing `0`, maximum consecutive missing `0`, category-reference coverage `0.995353`, unresolved IDs `0`, provider leakage `0`.
- Final evidence acceptance: PR #736.
- Hidden revalidation decision: PR #737.
- Hidden production browser revalidation: five of five scenarios passed and was accepted in PR #739 / `ef4f2ba3ea5bbbb739ac8d6941dad074fa05591d`.

## Immediate order

1. Publish the already-tested Twitch Category + Top controls on `/twitch/heatmap/`.
2. Preserve the accepted `All categories` / `Top 50` default and Top `20|50|100` choices.
3. Keep legacy `categoryPreview=1` links compatible but no longer require the hidden parameter.
4. Keep Kick category controls disabled and preserve all provider separation.
5. Merge only after typecheck, build, policy, public-surface, and browser gates pass.
6. Let the controlled Pages workflow deploy the merged main commit.
7. Run production acceptance against the normal Twitch route and freeze exact deployment/browser evidence.

## Hard stops

- No collector, Worker, D1 mutation/schema, binding, cadence, retention, or backfill change.
- No Kick category UI in this cutover.
- No cross-provider identity, totals, rankings, or synthetic category mapping.
- No claim of completed public rollout until deployed production acceptance passes and is frozen separately.
