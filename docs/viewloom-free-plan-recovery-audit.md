# ViewLoom Free Plan Recovery Audit

Status: recovery baseline audit  
Scope: ViewLoom repository after Cloudflare Free downgrade  
Created: 2026-05-15

## 1. Purpose

This audit records the known recovery problems that must be fixed without reducing ViewLoom quality.

This document is paired with `docs/viewloom-non-degradation-policy.md`.

## 2. Non-negotiable recovery rule

Do not downgrade product quality because of Cloudflare Free.

Allowed changes are backend-only optimizations: rollups, lighter payloads, cacheable aggregates, and honest stale / partial / empty / demo reporting.

Forbidden changes include removing agreed UI, interactions, page structure, feature scope, or data honesty.

## 3. Known repository state

The repository currently contains the ViewLoom web app skeleton and multiple major page implementations under `apps/web`.

Known app areas:

- Heatmap
- Day Flow
- Battle Lines / Rivalry Radar
- History & Trends
- Status
- shared labels / shell helpers
- Cloudflare Pages Functions APIs

## 4. Critical blockers

### 4.1 Legacy Livefield dependency

The following API paths were identified as critical recovery targets because they are known to have relied on the legacy Livefield deployment:

- `apps/web/functions/api/day-flow.ts`
- `apps/web/functions/api/battle-lines.ts`

Recovery requirement:

- `/api/day-flow` must be ViewLoom-owned.
- `/api/battle-lines` must be ViewLoom-owned.
- The pages must not depend on `https://livefield.pages.dev` for core payloads.

Current status:

- `livefield.pages.dev` repository search: 0 hits confirmed after owned API recovery.
- `/api/day-flow` is ViewLoom-owned.
- `/api/battle-lines` is ViewLoom-owned.

### 4.2 Baseline policy was missing

Before this branch, the repository did not contain a single mandatory document saying that Cloudflare Free must not reduce user-facing quality.

Recovery action in this branch:

- Add `docs/viewloom-non-degradation-policy.md`.

### 4.3 Heatmap renderer default must be verified

Heatmap has a Canvas / Camera / LOD recovery direction.

Recovery requirement:

- Canvas Heatmap must become the normal renderer when ready.
- DOM legacy rendering must not be used as a lower-quality substitute.
- User-facing interaction quality must remain the target.

### 4.4 Label cleanup must be source-level

The platform naming rules must be enforced in source, not only by after-build text replacement.

Recovery targets:

- remove `Twitch ViewLoom`
- remove `Kick ViewLoom`
- avoid official-looking platform-product combinations
- replace Compare role language with Rivalry where Battle Lines is the feature role
- use `Twitch data` and `Kick data` as platform labels

### 4.5 Status must be the first truth surface

Status must not remain a placeholder page.

Recovery requirement:

- collector state
- latest snapshot
- source mode
- feature matrix
- stale / partial / empty / demo / error states
- known limitations

Status must make clear when data is not ready or not real.

## 5. Phase schedule retained

The current recovery schedule remains:

```text
2026-05-15  Phase 0  Non-degradation baseline and recovery audit
2026-05-16  Phase 1  Status / label cleanup start
2026-05-17  Phase 1  Status / label cleanup complete
2026-05-18  Phase 2  Heatmap Canvas default
2026-05-19  Phase 2  Heatmap interaction fixes
2026-05-20  Phase 2  Heatmap PC/mobile QA
2026-05-21  Phase 3  Day Flow API ownership start
2026-05-22  Phase 3  Day Flow renderer/state connection
2026-05-23  Phase 3  Time Focus / Full / Top Focus checks
2026-05-24  Phase 3  Day Flow QA
2026-05-25  Phase 4  Battle Lines API ownership start
2026-05-26  Phase 4  Chart / selected time / inspector connection
2026-05-27  Phase 4  missing/offline/not observed cleanup
2026-05-28  Phase 4  Battle Lines QA
2026-05-29  Phase 5  History polish start
2026-05-30  Phase 5  History chart / ranking / daily cards
2026-05-31  Phase 5  History QA
2026-06-01  Phase 6  Kick Status
2026-06-02  Phase 6  Kick shell / labels / not_ready cleanup
2026-06-03  Phase 6  Kick QA
2026-06-04  Phase 7  Full QA
2026-06-05  Phase 7  Final pre-release check
```

## 6. Phase 0 completion criteria

Phase 0 is complete when:

- the non-degradation policy exists in the repo
- this recovery audit exists in the repo
- the first PR is opened from a recovery branch
- follow-up implementation tasks reference these docs, not only chat text

## 7. Next PR after this baseline

Next implementation PR should target Phase 1:

- Status truth surface improvements
- label source cleanup
- feature matrix verification
- `Compare` to `Rivalry` cleanup where applicable
- old official-risk labels removal

## 8. Guardrail for Codex or any coding agent

Any coding agent working on this repository must read these two files before implementation:

- `docs/viewloom-non-degradation-policy.md`
- `docs/viewloom-free-plan-recovery-audit.md`

A task is invalid if it attempts to reduce the agreed feature quality in order to fit Cloudflare Free.

## 9. CI gate

The repository now has a web check workflow for pull requests and main pushes.

Current gate intent:

- `pnpm typecheck:web`
- `pnpm build:web`

The typecheck gate includes both app source and Cloudflare Pages Functions.

Current CI smoke status:

- The pnpm cache configuration was removed because this repository does not currently commit `pnpm-lock.yaml`.
- The Day Flow `highestActivity` placeholder was normalized to `null` for Functions typecheck.
