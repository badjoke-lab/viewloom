# 12A-5B-R2 replacement Twitch accumulation and checkpoint failure diagnosis

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Canonical runtime gate remains v33.
- Checkpoint run `30478338654` completed read-only and failed.
- Evidence: `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`.
- One-time trigger, execution workflow, and reporter are retired.
- Current branch after retirement: `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package`.
- Public Twitch category-filter exposure remains unauthorized.

## Failed checkpoint gates

- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Consecutive gap: three buckets at `07:20`, `07:25`, `07:30` UTC, allowed maximum two.
- Category-reference coverage: 45,039/45,287 = `0.994524`, required `0.995`.
- Missing category refs: 248 null entries.
- Invalid refs: 0.
- Unresolved dictionary IDs: 0.

## Passed safety/runtime gates

Read-only mode, exact start, provider identities, five-minute cadence, schema, permanent bindings, storage, public containment, collector error count, provider leakage, latest real/fresh/non-empty category snapshot, and Kick baseline all passed.

## Current work order

1. Merge the evidence and retirement PR.
2. Create a read-only checkpoint-failure diagnosis package.
3. Accept the diagnosis path separately before any production query.
4. Diagnose missing buckets and null references without mutation.
5. Freeze diagnosis evidence and make a separate recovery/no-recovery decision.
6. Do not rerun checkpoint or final mode until that decision is accepted.

## Diagnosis questions

- Did the collector fail, skip, overlap, or write late around 07:20–07:30 UTC?
- Are the three buckets permanently absent?
- Which snapshot rows and stream positions contain null category refs?
- Are null refs concentrated in specific times/categories/stream records?
- Did Twitch omit category IDs, did normalization lose them, or did persistence lose them?
- Does a verified recovery require a new stability clock?

## Shared boundaries

- No threshold relaxation, interpolation, backfill, or row invention.
- No Worker deployment, cron/cadence, D1 schema, retention, Kick, or cross-provider change.
- No automatic recovery or clock reset.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

Before every branch and merge, read current main roadmap, schedule, canonical gate, audit specification, checkpoint evidence, retirement record, active WIP, development policy, and the affected feature specification/plan.
