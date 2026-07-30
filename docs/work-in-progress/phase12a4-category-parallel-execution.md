# 12A-5B-R2 Twitch-only category-source-v2 execution package

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Diagnosis decision: recovery required; original stability window retired.
- Dormant package accepted: package PR #682 / acceptance PR #684.
- Validation run/job: `30567807300` / `90956596848`.
- Candidate remains unimported by active collectors and has no production binding.
- Current branch: `work-659-twitch-category-source-v2-completeness-execution-package`.
- Public Twitch category-filter exposure remains unauthorized.

## Accepted candidate

- Contract: `category-source-v2-candidate`.
- Encoding: `2bit-hex-v1`.
- States: `both_present`, `both_empty`, `provider_id_only`, `category_name_only`.
- 300-item evidence: v1 1465 bytes, v2 1813 bytes, overhead 348 bytes.

## Current work order

1. Build a Twitch-only disabled-by-default integration while preserving v1 as default/rollback.
2. Define exact trigger, bounded timeout envelope, two-consecutive-snapshot evidence, rollback, storage, and provider-separation gates.
3. Execution-package PR uses no production credentials or execution.
4. Accept the execution package separately before a trigger.
5. Freeze post-activation evidence and decide semantic handling/new clock separately.

## Boundaries

- No production execution before a separately accepted execution package and exact trigger.
- No Kick import or binding.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No cadence, retention, cross-provider, or final-mode change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.
