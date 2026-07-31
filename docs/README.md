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
Observation execution package accepted PR #685 / #686
Current gate exact immediate Twitch category-source-v2 observation trigger
Current branch work-659-twitch-category-source-v2-observation-trigger
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
8. `docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json`
9. `docs/audits/12a5-twitch-category-source-v2-observation-execution-package-acceptance.json`
10. `docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json`
11. `docs/product/twitch-replacement-seven-day-audit-spec.md`
12. active WIP and affected feature specification/plan

## Accepted observation execution package

- Package PR / acceptance PR: #685 / #686.
- Package candidate head / merge: `b0931fa5a22a825f599bb576b4507473f1dc6731` / `0a8f2931524d08dae42dee302df24a30da544949`.
- Validation run/job: `30570462889` / `90965620950`.
- The package generates a temporary Twitch-only v2 observation Worker from exact accepted blobs.
- The trigger executes immediately after merge and forbids `startAt`, pre-start sleep, manual dispatch, and schedules.
- Observation polling is bounded to 16 minutes and requires two consecutive real, non-empty, fresh v2 snapshots.
- Canonical v1 rollback runs in `finally`; the 50-minute job timeout exceeds the accepted 44-minute maximum envelope.
- Package and acceptance PRs performed no production execution and exposed no public category controls.

## Current order

1. Create `work-659-twitch-category-source-v2-observation-trigger`.
2. Add exactly `docs/audits/12a5-twitch-category-source-v2-observation-trigger.json` with accepted package identity and no `startAt`.
3. Merge the exact one-file PR to start the bounded production observation immediately.
4. Freeze run/job/artifact/digest evidence and retire the trigger and temporary execution path separately.
5. Decide semantic handling and the new stability clock separately.

## Invariants

- No production observation before the accepted exact one-file trigger is merged.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- Twitch/Kick remain separated on the existing five-minute cadences.
- Public category controls remain unauthorized.
- Existing unfiltered Heatmap remains the fallback.
- Current-main documents and accepted contracts override cached handoffs.
