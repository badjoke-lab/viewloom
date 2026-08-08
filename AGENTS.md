# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 Twitch category stability + Heatmap public rollout complete
Historical runtime gate: viewloom-12a2-current-gate-state-v33 retained as immutable accumulation evidence
Final audit accepted: PR #736
Final-mode decision accepted: PR #737
Hidden production revalidation accepted: PR #739
Public cutover: PR #740
Mobile overflow repair: PR #741
Accepted production SHA: b006f45d0676c9ff3e05e5d6727458e43802de53
Pages deploy run: 31244148642 success
Public production acceptance run: 31244148651 success
Twitch Heatmap public category-filter exposure: active
Kick category UI: unauthorized
Twitch cadence: */5 * * * *
Kick cadence: */5 * * * *
```

## Mandatory authorities

Before every branch and merge, read current-main docs index, roadmap, schedule, development policy, the immutable historical runtime gate, final Twitch audit evidence/acceptance, final-mode decision, hidden production revalidation evidence/acceptance, public-cutover decision, deployed public evidence/acceptance, affected feature plan, and current WIP/handoff.

## Accepted decisions

- Provider-scoped category identity is `(provider, categoryProviderId)`.
- Only source pairs with both provider ID and category name create a category reference.
- Incomplete source pairs remain null coverage; no synthetic, name-only, or cross-provider mapping is allowed.
- The final seven-day Twitch audit accepted `2016 / 2016` expected five-minute slots with no missing or consecutive-missing buckets.
- Twitch Heatmap Category + Top controls are accepted on the normal `/twitch/heatmap/` route.
- Public defaults are `All categories` and `Top 50`; allowed Top values are `20`, `50`, and `100`; category filtering occurs before Top-N slicing.
- The first public candidate was correctly rejected for 390px mobile overflow (`474 / 390`); PR #741 repaired the presentation-only width defect.
- Accepted production SHA `b006f45d0676c9ff3e05e5d6727458e43802de53` passed deployed public acceptance with 390px `scrollWidth=390`.

## Current execution order

1. Freeze and preserve the accepted Twitch Heatmap public rollout evidence and provenance.
2. Close completed audit issue #659 and Twitch Heatmap rollout issue #635 after the closeout PR merges.
3. Keep parent category program #623 open.
4. Treat Day Flow category UI, History category UI, and Kick category UI as separate future decisions.

## Production safety

- `main` is production; no direct push.
- Do not recreate retired observation/final-audit execution paths without a new governed decision.
- No backfill, threshold relaxation, synthetic category mapping, or cross-provider identity/totals/rankings.
- No automatic Kick, Day Flow, or History category UI rollout from the Twitch Heatmap acceptance.
- Existing Twitch and Kick five-minute collector cadences, D1 boundaries, bindings, and retention remain unchanged.
