# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-29

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Replacement Twitch seven-day clock start 2026-07-29T05:30:00.000Z
Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z
Replacement audit issue #659
Dormant replacement audit package accepted yes
Package PR #661
Package acceptance PR #662
Current gate runner repair sqlite_cte_scope_cross_statement
Current branch work-659-twitch-replacement-audit-runner-query-fix
Checkpoint package blocked until runner repair acceptance
Twitch Heatmap public category-filter exposure authorized no
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
D1 schema mutation no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
```

## Accepted baselines

### Recovery

- Trigger PR: #655; merge `40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4`.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Acceptance PR: #657; merge `5565640b26a0fe8e896e5c47eb054b3363f50463`.
- Canonical synchronization: PR #658; commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Permanent binding present, cadence unchanged, leakage zero, storage gates passed, rollback not required, Kick unchanged.

### Dormant audit package

- Package PR: #661; merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Package validation run/job: `30455002204` / `90586212618`.
- Package acceptance PR: #662; merge `3f15d18ee3f7b31a71b10ff6f192eead404da92b`.
- Window: `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`.
- Expected slots: 2016.
- Checkpoint mode: diagnostic and non-authorizing.
- Final mode: blocked before the exact boundary.
- Production execution in package and acceptance PRs: none.
- Public category controls in production build: absent.

## Current repair gate

Pre-execution review found `sqlite_cte_scope_cross_statement` in the accepted runner.

The first SQL statement defined CTE `scoped`, while a later independent statement attempted `FROM scoped`. SQLite CTE scope ends with the defining statement, so checkpoint execution would fail during observed-slot enumeration.

Current response:

1. Repair branch: `work-659-twitch-replacement-audit-runner-query-fix`.
2. Export a pure SQL builder.
3. Read slot rows directly from `minute_snapshots` with the exact Twitch provider, half-open window, and `category-source-v1` predicate.
4. Test that every statement begins with `SELECT` or `WITH` and no later statement references `scoped`.
5. Merge only after repair, package, category-policy, development-policy, build, and public-control-absence checks pass.
6. Freeze a separate repair acceptance record.
7. Resume `work-659-twitch-replacement-audit-checkpoint-package` only after repair acceptance.

No production checkpoint or final audit has executed. No Cloudflare/D1 credentials are used by the repair PR.

## Execution window through 2026-08-05

### Immediate — runner repair

1. Validate `work-659-twitch-replacement-audit-runner-query-fix`.
2. Confirm pure SQL statement-scope regression coverage.
3. Confirm exact 2016-slot and checkpoint/final semantics are unchanged.
4. Confirm no Worker deployment, D1 execution/mutation, cadence change, Kick change, or public UI change.
5. Merge the repair through a squash PR.
6. Create `work-659-twitch-replacement-audit-runner-query-fix-acceptance` and freeze repair identities.

Stop rule: checkpoint package and production read-only execution remain blocked until repair acceptance is on main.

### After repair acceptance — checkpoint package

1. Create `work-659-twitch-replacement-audit-checkpoint-package`.
2. Add a separate bounded checkpoint execution workflow and exact trigger contract.
3. Use checkpoint mode only.
4. Add no Worker cron; execution must be bounded and explicit.
5. Freeze sanitized diagnostic evidence after the path is separately accepted.
6. Do not treat checkpoint evidence as #659 acceptance or public-cutover authorization.

### Independent product work after checkpoint priority is secured

1. Start `work-heatmap-canvas-module-split`.
2. Complete responsibility separation with no public behavior change.
3. Add `work-heatmap-canvas-scene` only after module-split acceptance; keep it hidden or disabled.
4. Inspect #148 and apply targeted Day Flow/Battle Lines provider-parity fixes.
5. Reread current roadmap, schedule, gate, affected specs, and active WIP before each branch and merge.

### 2026-08-05 at or after 05:30 UTC / 14:30 JST

1. Execute accepted #659 final mode read-only.
2. Freeze exact workflow/job/artifact/digest and sanitized evidence.
3. Accept or reject the complete 2016-slot window in a separate PR.
4. Do not expose the category filter from the audit or acceptance PR.
5. A later separate 12A-5C cutover remains required.

## Hard stops

- runner repair not accepted;
- permanent Twitch binding absent;
- category-bearing collection stale or stopped;
- provider leakage above zero;
- Twitch projected 90-day size above 440 MB or provider headroom below 10 MB;
- projected account-wide D1 headroom below 500 MB;
- any Kick configuration, binding, row, API, UI, or runtime mutation from Twitch-only work;
- any collector cadence, D1 schema, backfill, retention, or cross-provider change;
- any checkpoint treated as audit acceptance;
- any final-mode execution before `2026-08-05T05:30:00.000Z`;
- any public category-filter exposure before accepted final evidence and separate cutover;
- any Heatmap Canvas production cutover before its own final validation.

## Mandatory references

Every branch and PR must read current-main versions of:

1. `AGENTS.md`;
2. `docs/README.md`;
3. `docs/operations/development-and-deployment-policy.md`;
4. `docs/product/current-roadmap.md`;
5. this schedule;
6. `docs/audits/12a2-current-gate-state.json`;
7. `docs/product/twitch-replacement-seven-day-audit-spec.md`;
8. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`;
9. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`;
10. `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json` while repair is active;
11. the affected feature specification and plan;
12. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
13. relevant immutable acceptance/evidence records.

The PR must record the current-main SHA read. If these documents conflict, documentation repair precedes implementation.
