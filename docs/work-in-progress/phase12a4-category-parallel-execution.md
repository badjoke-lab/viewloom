# 12A-5B-R2 Twitch category-source-v2 completeness recovery package

## Status

- Twitch and Kick permanent category capture remain active on five-minute cadences.
- Diagnosis evidence is frozen; one-time diagnosis paths are retired.
- Diagnosis decision: recovery required.
- Original stability start `2026-07-29T05:30:00.000Z` and earliest audit `2026-08-05T05:30:00.000Z` are retired.
- Current branch: `work-659-twitch-category-source-v2-completeness-recovery-package`.
- Dormant candidate implementation and package contract are present for validation.
- Active Twitch and Kick collectors do not import the candidate.
- Public Twitch category-filter exposure remains unauthorized.

## Candidate package

- Implementation: `workers/shared/category-capture-v2-candidate.ts`.
- Contract: `docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json`.
- Contract version: `category-source-v2-candidate`.
- State encoding: `2bit-hex-v1`.
- States: `both_present`, `both_empty`, `provider_id_only`, `category_name_only`.
- Only `both_present` items receive category references and dictionary entries.
- 300 items require at most 75 packed bytes before hex representation; comparable-v1 payload overhead is capped at 400 bytes.

## Current work order

1. Validate compile, four-state classification, two-bit round trip, determinism, capacity, provider separation, typecheck/build, and public containment.
2. Merge the dormant package only after all gates pass.
3. Create a separate package-acceptance PR before any execution package.
4. Accept and execute separately, then freeze two consecutive real/nonempty/fresh snapshots.
5. Decide semantic handling and a new stability start separately.

## Boundaries

- Package PR performs no production execution.
- No active collector import or production binding.
- No checkpoint rerun, backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, or cross-provider change.
- No public category UI.
- Existing unfiltered Heatmap remains the fallback.
