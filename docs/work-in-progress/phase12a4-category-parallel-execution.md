# 12A-5B-R2 replacement Twitch checkpoint-failure diagnosis decision

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Canonical runtime gate remains v33.
- Checkpoint run `30478338654` completed read-only and failed.
- Checkpoint path is retired.
- Diagnosis query package/acceptance: PRs #670/#671.
- Diagnosis execution package/acceptance: PRs #672/#673.
- Exact trigger PR #678 merged as `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Sanitized diagnosis evidence is frozen.
- Exact trigger, one-time execution workflow, and temporary reporter are retired.
- Current branch: `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
- Public Twitch category-filter exposure remains unauthorized.

## Frozen checkpoint gates

- Slot coverage: 151/154 = `0.980519`, required `0.995`.
- Three consecutive missing buckets: `07:20`, `07:25`, `07:30` UTC.
- Category-reference coverage: 45,039/45,287 = `0.994524`, with 248 null refs.
- Invalid refs and unresolved dictionary IDs: 0.

## Frozen diagnosis execution

- run/job/artifact: `PENDING_DIAGNOSIS_IDENTIFIERS`;
- artifact digest: `PENDING_DIAGNOSIS_ARTIFACT_DIGEST`;
- evidence JSON SHA-256: `PENDING_DIAGNOSIS_EVIDENCE_SHA256`;
- evidence path: `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json`.

## Current work order

1. Merge the evidence/retirement PR after pending values are replaced and verified.
2. Create a separate diagnosis-decision PR.
3. Decide whether recovery is required and how the stability clock must be treated.
4. Do not mutate production in the decision PR.
5. Package any required recovery separately.
6. Keep final mode and public UI blocked until later accepted gates.

## Decision questions

- Were the three missing snapshot rows permanently absent?
- Did collector-run history record a bounded cause?
- Are null category refs concentrated in channels with upstream-empty category fields?
- Is post-checkpoint null-ref behavior stable, improving, or worsening?
- Does the evidence indicate a collector defect that requires recovery?
- Can the original replacement clock remain valid?

## Shared boundaries

- No checkpoint rerun.
- No threshold relaxation, interpolation, backfill, or row invention.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 mutation, retention, Kick, final mode, or cross-provider change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

Before every branch and merge, read current-main roadmap, schedule, canonical gate, audit specification, checkpoint evidence/retirement, diagnosis query/execution contracts and acceptances, diagnosis evidence/retirement, active WIP, development policy, and affected feature specification/plan.
