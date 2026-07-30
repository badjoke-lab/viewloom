# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active on five-minute collectors.
- Checkpoint and diagnosis evidence are frozen; the old replacement window is retired.
- Recovery decision PR #681 requires source-completeness observation before a new clock.
- Dormant `category-source-v2-candidate` package accepted PR #682 / #684.
- Validation run/job `30567807300` / `90956596848` passed compile, four-state encoding, capacity, collector/web typecheck, build, deployment skip, and public containment.
- Capacity evidence: 300 items, 150 packed hex characters, v1 comparable 1465 bytes, v2 candidate 1813 bytes, overhead 348 bytes under the 400-byte limit.

### Current gate: Twitch-only category-source-v2 execution package

Current branch:

`work-659-twitch-category-source-v2-completeness-execution-package`

## Accepted package

- Contract version: `category-source-v2-candidate`.
- States: `both_present`, `both_empty`, `provider_id_only`, `category_name_only`.
- Only `both_present` items receive category references and dictionary entries.
- Active Twitch/Kick collectors still do not import the candidate.
- No production binding, execution, semantic mapping, clock start, or public UI was accepted.

## Active deliverable

Create a bounded Twitch-only execution package that:

- integrates the accepted candidate behind a new Twitch-only disabled-by-default flag;
- preserves the current v1 path as the default and rollback path;
- adds no Kick import or binding;
- defines exact activation, two-consecutive-snapshot evidence, rollback, storage, and provider-separation gates;
- performs no production execution on the execution-package PR;
- requires separate execution-package acceptance and an exact trigger.

## Following gates

1. execution package;
2. separate execution-package acceptance and exact Twitch-only trigger;
3. two consecutive real/nonempty/fresh v2 snapshots;
4. semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and separate public cutover.

## Hard boundaries

- No production execution before a separately accepted execution package and exact trigger.
- No checkpoint rerun, backfill, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.
