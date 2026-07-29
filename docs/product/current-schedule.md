# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-30

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Replacement Twitch seven-day clock start 2026-07-29T05:30:00.000Z
Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z
Replacement audit issue #659
Dormant replacement audit package accepted PR #661 / #662
Runner repair accepted PR #663 / #664
Checkpoint package PR #665
Checkpoint package acceptance PR #666
Current gate exact one-file checkpoint trigger
Current branch work-659-twitch-replacement-audit-checkpoint-trigger
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

### Dormant final/checkpoint runner

- Source package PR: #661; merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Package acceptance PR: #662; merge `3f15d18ee3f7b31a71b10ff6f192eead404da92b`.
- Window: `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`; final slots: 2016.
- Runner repair PR: #663; merge `ab33afa4d6195532652791be2380a1fa9a278491`.
- Repair validation run/job: `30475011149` / `90654426211`.
- Repair acceptance PR: #664.

### Checkpoint execution package

- Checkpoint package PR #665; merge `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
- Validation run/job: `30476596379` / `90659857133`.
- Checkpoint package acceptance PR #666.
- Mode: checkpoint only.
- End boundary: latest completed five-minute boundary capped at final end.
- Trigger: exact one-file push trigger, absent until the next PR.
- Cloudflare methods: GET only.
- D1 statements: SELECT/WITH only.
- Package and acceptance PR production execution: none.
- Production checkpoint job on package PR: skipped.
- Public category controls: absent.
- Checkpoint evidence: diagnostic and non-authorizing.

## Immediate execution order

### 1. Exact trigger PR

Create `work-659-twitch-replacement-audit-checkpoint-trigger` from the accepted main.

The PR must add only:

`docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json`

The trigger must contain:

- schema `viewloom-12a5-twitch-replacement-audit-checkpoint-trigger-v1`;
- status `armed`;
- provider `twitch`;
- mode `checkpoint`;
- oneTime `true`;
- confirmation `RUN_TWITCH_REPLACEMENT_AUDIT_CHECKPOINT`;
- package PR `665`;
- package merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`;
- an exact `startAt` within the accepted time bound.

The trigger PR may validate identity but must not execute the production checkpoint before merge.

### 2. Bounded diagnostic execution

After the exact trigger reaches main:

1. execute checkpoint mode once through the accepted workflow;
2. use the accepted start and latest completed five-minute boundary capped at final end;
3. upload sanitized JSON evidence;
4. freeze workflow run, job, artifact, digest, observation time, and evidence digest;
5. report slot coverage/gaps, payload/reference/dictionary state, binding/cadence/errors/leakage, storage, public containment, and Kick unchanged;
6. do not accept #659 or authorize public UI;
7. retire the trigger and temporary execution path after evidence freeze unless an accepted contract retains the verifier.

### 3. Parallel product work

After checkpoint execution/evidence priority is secured:

- start `work-heatmap-canvas-module-split` with no public behavior change;
- add a hidden/disabled Canvas scene only after module-split acceptance;
- inspect and fix provider UI parity gaps from #148;
- reread current roadmap, schedule, gate, affected specs, and active WIP before each branch and merge.

### 4. Final boundary

At or after `2026-08-05T05:30:00.000Z` / `2026-08-05 14:30 JST`:

1. execute accepted #659 final mode read-only;
2. freeze exact workflow/job/artifact/digest and sanitized evidence;
3. accept or reject the complete 2016-slot window in a separate PR;
4. keep the category filter hidden;
5. require a later separate 12A-5C public cutover PR.

## Hard stops

- package or trigger identity mismatch;
- trigger outside the accepted start bound;
- permanent Twitch binding absent;
- category-bearing collection stale or stopped;
- provider leakage above zero;
- Twitch projected 90-day size above 440 MB or provider headroom below 10 MB;
- projected account-wide D1 headroom below 500 MB;
- any Kick mutation from Twitch-only work;
- any Worker deployment, cadence, D1 mutation, backfill, retention, or cross-provider change;
- any checkpoint treated as audit acceptance;
- any final-mode execution before `2026-08-05T05:30:00.000Z`;
- any public category-filter exposure before accepted final evidence and separate cutover.

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
9. `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`;
10. `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`;
11. `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`;
12. `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`;
13. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
14. the affected feature specification and plan;
15. relevant immutable acceptance/evidence records.

The PR must record the current-main SHA read. If these documents conflict, documentation repair precedes implementation.
