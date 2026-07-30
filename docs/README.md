# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-31

## Current execution state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Diagnosis run 30541697022 attempt 2 succeeded
Diagnosis evidence frozen and execution path retired
Diagnosis decision recovery required
Original stability clock valid no
Current branch work-659-twitch-category-source-v2-completeness-recovery-package
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json`
6. frozen checkpoint and diagnosis evidence/retirement
7. `docs/product/twitch-replacement-seven-day-audit-spec.md`
8. active WIP and affected feature specification/plan

## Governing decision

- Three consecutive historical rows are absent and exceed the accepted maximum of two.
- Category-reference coverage stayed below `0.995` after the checkpoint.
- The old clock and August 5 boundary are retired.
- A Twitch-only v2 source-completeness observation recovery is required before a new clock may be fixed.
- No historical backfill, threshold relaxation, synthetic category mapping, or automatic clock reset is authorized.

## Current order

1. Create the dormant `category-source-v2-candidate` recovery package.
2. Preserve exact Twitch source-completeness states before source fields are stripped.
3. Validate tests, storage, cost, provider separation, and public containment without production execution.
4. Accept and activate separately for Twitch only.
5. Freeze consecutive post-activation evidence and decide semantic handling/new clock separately.

## Invariants

- Twitch/Kick remain separated on the existing five-minute cadences.
- Public category controls remain unauthorized.
- Existing unfiltered Heatmap remains the fallback.
- Current-main documents and the diagnosis decision override cached handoffs.
