# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659  
Canonical start: `2026-07-29T05:30:00.000Z`  
Earliest calendar final boundary: `2026-08-05T05:30:00.000Z`

## Purpose

Govern the replacement Twitch category accumulation audit without exposing public category controls or mutating production data.

## Accepted history

- Recovery accepted in PR #657; canonical state synchronized in PR #658.
- Dormant runner accepted through PRs #661/#662.
- SQL scope repair accepted through PRs #663/#664.
- Bounded checkpoint package accepted through PRs #665/#666.
- Exact trigger PR #667 merged as `ee8125ecd12f7ec620af13fd78d9a3c3c7e18f98`.

## Checkpoint execution and result

Checkpoint run/job/artifact:

- run `30478338654`;
- job `90665697236`;
- artifact `8734980337`;
- artifact digest `sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b`;
- evidence JSON SHA-256 `041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f`.

The checkpoint executed read-only over `[2026-07-29T05:30:00Z, 2026-07-29T18:20:00Z)` and failed.

### Failed hard stops

1. `slotCoveragePass`
   - expected 154 slots;
   - observed 151;
   - coverage `0.980519` below required `0.995`.
2. `consecutiveMissingSlotsPass`
   - missing `2026-07-29T07:20:00Z`, `07:25:00Z`, `07:30:00Z`;
   - maximum consecutive missing slots 3, above allowed 2.
3. `categoryReferenceCoveragePass`
   - 45,039 present references of 45,287 total;
   - 248 null references;
   - coverage `0.994524` below required `0.995`.

The 248 missing references are `null` entries in per-stream `categoryRefs`. They are not invalid indices: `invalidCategoryRefs = 0`. They are not unresolved dictionary IDs: `unresolvedCategoryIds = 0`.

### Passed gates

- read-only execution;
- exact accumulation start and checkpoint end;
- Twitch/Kick identity and five-minute cadence;
- required schema and permanent bindings;
- storage thresholds;
- public-surface containment;
- payload structure, real/non-empty category rows, dictionary presence/names/contract/resolution;
- collector errors zero;
- provider leakage zero;
- latest snapshot real, non-empty, category-bearing, and fresh;
- Kick unchanged;
- public category UI unauthorized;
- no production mutation.

## Evidence and retirement

Authorities:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`

The one-time trigger, checkpoint execution workflow, and temporary reporter are retired. The failed checkpoint cannot be rerun automatically.

## Current gate: failure diagnosis

Current branch after evidence retirement:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package`

The diagnosis package must remain read-only and answer:

- why the three consecutive minute buckets are absent;
- whether late natural writes can restore them without backfill;
- which snapshot/stream rows contain the 248 null refs;
- whether null refs originate upstream, in normalization, or in persistence;
- whether a verified recovery and new clock are required.

## Prohibited responses to checkpoint failure

- rerunning the same checkpoint to seek a better result;
- relaxing the accepted thresholds;
- interpolating or inventing missing buckets;
- unauthorized backfill;
- automatic Worker/config mutation;
- automatic stability-clock reset;
- treating the calendar final boundary as authorization to execute final mode;
- exposing public category controls.

## Final mode

`2026-08-05T05:30:00Z` remains the earliest calendar boundary, but final execution now additionally requires an accepted failure diagnosis and decision. A final audit never exposes UI by itself; a later separate cutover PR remains required.
