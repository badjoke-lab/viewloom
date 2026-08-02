# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659

## Current authority

Provider-scoped semantic handling and the revised stability clock are accepted.

- Corrected observation package: PR #692 / #693.
- Successful run/job/artifact: `30620512044` / `91123756273` / `8789385200`.
- Evidence freeze and temporary execution-path retirement: PR #697 / #698.
- Semantic decision: PR #699 / merge `ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e`.
- Stability-clock acceptance: PR #700 / merge `d2316f10ba970818a47605a76a9ee9f235c517a4`.

## Accepted semantics

- Category identity is `(provider, categoryProviderId)`.
- Only `both_present` source pairs create a category reference and dictionary entry.
- `both_empty`, `provider_id_only`, and `category_name_only` remain null references and count as missing or incomplete source coverage.
- Synthetic, name-only, and cross-provider mapping is prohibited.
- Combined-provider category ranking is prohibited.

## Current gate: active stability accumulation

Accepted half-open window:

```text
start: 2026-07-31T17:00:00.000Z
end-exclusive: 2026-08-07T17:00:00.000Z
JST: 2026-08-01 02:00 to 2026-08-08 02:00
cadence: 5 minutes
expected slots: 2016
first expected bucket: 2026-07-31T17:00:00.000Z
```

Activation is passive: the existing Twitch collector continues normally. No start-time workflow, new cron, Worker deployment, checkpoint, D1 mutation, binding change, retention change, Kick change, domain change, or operator action is required.

## Final audit gate

Final read-only mode is prohibited before `2026-08-07T17:00:00.000Z`. At or after the end boundary, the governed audit must evaluate all 2016 expected slots, continuity, category-reference coverage, dictionary integrity, freshness, provider leakage, permanent bindings, collector health, and storage safety.

Final evidence must be frozen and separately accepted. Passing the audit does not automatically expose the category filter; final mode and public cutover remain separate decisions.

## Prohibited responses

- observation rerun, checkpoint rerun, or recreation of retired temporary execution paths without a new governed sequence;
- historical backfill, row invention, threshold relaxation, synthetic mapping, or clock reset;
- final audit before the end boundary;
- Kick, cadence, retention, cross-provider, final-mode, or public category-filter change during accumulation.
