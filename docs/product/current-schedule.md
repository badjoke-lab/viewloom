# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-31

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Canonical runtime gate viewloom-12a2-current-gate-state-v33
Diagnosis decision recovery required
Original stability clock valid no
Dormant package accepted PR #682 / #684
Execution package accepted PR #685 / #686
Current gate exact immediate category-source-v2 observation trigger
Current branch work-659-twitch-category-source-v2-observation-trigger
Public Twitch category-filter exposure authorized no
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Accepted execution package

- Package/acceptance: PRs #685/#686.
- Package merge: `0a8f2931524d08dae42dee302df24a30da544949`.
- Validation run/job: `30570462889` / `90965620950`.
- Immediate execution: yes; `startAt`: forbidden; pre-start sleep: none.
- Observation maximum: 16 minutes; timeout envelope: 44 minutes; job timeout: 50 minutes.
- Required snapshots: two consecutive real/non-empty/fresh v2 snapshots.
- Canonical v1 rollback: mandatory.
- Direct D1 statements: `SELECT` / `WITH` only.
- Production execution on package and acceptance PRs: none.

## Immediate order

1. Create `work-659-twitch-category-source-v2-observation-trigger`.
2. Add exactly one trigger JSON bound to PRs #685/#686 and package merge `0a8f2931524d08dae42dee302df24a30da544949`.
3. Set `executeImmediately: true`; do not include `startAt`.
4. Confirm trigger validation succeeds and production observation is skipped on the PR event.
5. Merge the trigger and execute the accepted observation once on main push.
6. Freeze sanitized evidence and retire the trigger, execution workflow, and execution package paths.
7. Decide semantic handling and the new stability clock separately.

## Hard stops

- No future `startAt` or long in-job wait.
- No production execution before the exact accepted trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
