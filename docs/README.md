# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-31

## Current execution state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Diagnosis decision recovery required
Original stability clock valid no
Dormant v2 package accepted PR #682 / #684
Current gate Twitch-only category-source-v2 execution package
Current branch work-659-twitch-category-source-v2-completeness-execution-package
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. diagnosis decision/evidence/retirement
6. `docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json`
7. `docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json`
8. `docs/product/twitch-replacement-seven-day-audit-spec.md`
9. active WIP and affected feature specification/plan

## Accepted dormant package

- Package PR / acceptance PR: #682 / #684.
- Package merge: `2ae91cbf6b07616dcadc60894a832ace089c39fa`.
- Validation run/job: `30567807300` / `90956596848`.
- Candidate contract: `category-source-v2-candidate`.
- Four states: `both_present`, `both_empty`, `provider_id_only`, `category_name_only`.
- Capacity evidence: 300 items, 150 packed hex characters, v1 comparable 1465 bytes, v2 candidate 1813 bytes, overhead 348 bytes under the 400-byte limit.
- Active Twitch/Kick collectors remain candidate-free; no production binding or execution was accepted.

## Current order

1. Create `work-659-twitch-category-source-v2-completeness-execution-package`.
2. Add a Twitch-only disabled-by-default integration while preserving v1 as default and rollback.
3. Define an exact trigger, bounded timeout envelope, two-consecutive-snapshot evidence, rollback, storage, and provider-separation gates.
4. Accept the execution package separately before an exact trigger.
5. Freeze post-activation evidence and decide semantic handling/new clock separately.

## Invariants

- No production execution before a separately accepted execution package and exact trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- Twitch/Kick remain separated on the existing five-minute cadences.
- Public category controls remain unauthorized.
- Existing unfiltered Heatmap remains the fallback.
- Current-main documents and accepted contracts override cached handoffs.
