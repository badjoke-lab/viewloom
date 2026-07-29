# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-30

```text
Phase 12A-5B-R2 replacement Twitch accumulation active
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Replacement stability start 2026-07-29T05:30:00.000Z
Earliest calendar final boundary 2026-08-05T05:30:00.000Z
Checkpoint run 30478338654
Checkpoint outcome failed
Checkpoint trigger/path retired yes
Current gate checkpoint failure diagnosis package
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package
Public Twitch category-filter exposure authorized no
Existing Twitch cadence */5 * * * * unchanged
Existing Kick cadence */5 * * * * unchanged
```

## Checkpoint result

- Trigger PR: #667; merge `ee8125ecd12f7ec620af13fd78d9a3c3c7e18f98`.
- Run/job/artifact: `30478338654` / `90665697236` / `8734980337`.
- Artifact digest: `sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b`.
- Evidence JSON SHA-256: `041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f`.
- Observation window: `[2026-07-29T05:30:00Z, 2026-07-29T18:20:00Z)`.
- Expected/observed slots: 154 / 151.
- Missing slots: `07:20`, `07:25`, `07:30` UTC.
- Coverage: `0.980519`, below required `0.995`.
- Maximum consecutive missing slots: 3, above allowed 2.
- Category references: 45,039 / 45,287 present; 248 null refs.
- Reference coverage: `0.994524`, below required `0.995`.
- Unresolved category IDs: 0; invalid refs: 0.
- Latest snapshot: real, non-empty, category-bearing, fresh.
- Permanent bindings, five-minute cadence, schema, storage, public containment, provider separation, and Kick baseline passed.
- Production mutation: none.
- Public cutover authorization: none.

## Immediate order

1. Merge the checkpoint evidence and retirement record.
2. Create and separately accept `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package`.
3. Use read-only queries to determine:
   - why the three consecutive buckets are absent;
   - whether they can appear without unauthorized backfill;
   - which snapshots and streams produced the 248 null category references;
   - whether the reference deficit is transient, source-derived, or collector-derived.
4. Freeze diagnosis evidence separately.
5. Decide separately whether recovery and a new clock are required.
6. Do not execute final mode merely because `2026-08-05T05:30:00Z` is reached; diagnosis/decision acceptance is now an additional prerequisite.

## Hard stops

- no checkpoint rerun;
- no threshold relaxation;
- no backfill or retroactive row invention;
- no automatic recovery or stability-clock reset;
- no Worker deployment, cadence change, D1 mutation, retention change, Kick mutation, or cross-provider change;
- no public category-filter exposure;
- no final-mode execution before a separately accepted diagnosis decision.

## Mandatory references

Read current-main versions of roadmap, this schedule, canonical gate, audit specification, checkpoint evidence, retirement record, active WIP, affected feature specification/plan, and development policy before every branch and again before merge.
