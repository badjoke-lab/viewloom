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
- Checkpoint package/acceptance/trigger completed through PRs #665–#667.
- Checkpoint run `30478338654` failed; evidence and retirement merged in PR #669.
- Diagnosis query package/acceptance completed through PRs #670/#671.
- Diagnosis execution package PR #672 merged as `02ece37cc70de4faa5251600a465d4e68d058f29`.
- Execution package acceptance PR #673 fixes the package identity, validation run/job, and exact trigger contract.

## Checkpoint execution and result

Failed hard stops:

- slot coverage 151/154 = `0.980519`, required `0.995`;
- three consecutive missing slots at `07:20`, `07:25`, `07:30` UTC, allowed maximum two;
- category-reference coverage 45,039/45,287 = `0.994524`, with 248 null references.

The null refs are not invalid indices and are not unresolved dictionary IDs. Runtime safety, bindings, cadence, storage, public containment, latest real/fresh snapshot, zero leakage, and Kick baseline passed.

## Accepted diagnosis scope

The accepted read-only runner returns missing-bucket presence, collector-run and snapshot context, null refs by bucket/channel, checkpoint and post-checkpoint summaries, current collector status, static source attribution, and persisted-data limitations.

Persisted payloads cannot distinguish empty Helix `game_id` from empty `game_name` because category source fields are stripped after `categoryRefs` are encoded.

## Accepted diagnosis execution package

Authorities:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json`
- `.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml`

Accepted identity:

- package PR #672;
- package candidate head `c496963f03611be4e9b957e6bf99d15f0d97bad4`;
- package merge `02ece37cc70de4faa5251600a465d4e68d058f29`;
- validation run/job `30539504888` / `90860798797`;
- acceptance PR #673.

The package and acceptance PRs performed no production diagnosis. Trigger was absent; production job was skipped. D1 statements are `SELECT` / `WITH` only.

## Current gate: exact failure-diagnosis trigger

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`

The trigger PR must:

- add only `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json`;
- identify package PR #672, merge `02ece37cc70de4faa5251600a465d4e68d058f29`, and acceptance PR #673;
- use schema `viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-v1`;
- use confirmation `RUN_TWITCH_CHECKPOINT_FAILURE_DIAGNOSIS`;
- set a bounded exact `startAt`;
- pass trigger validation on the PR while production diagnosis remains skipped;
- run diagnosis once only after main merge.

## Prohibited responses to checkpoint failure

- checkpoint rerun or threshold relaxation;
- interpolation, backfill, or invented rows;
- automatic Worker/config mutation or stability-clock reset;
- final mode before an accepted diagnosis decision;
- Kick or cross-provider changes;
- public category-filter exposure.

## Final mode

`2026-08-05T05:30:00Z` remains the earliest calendar boundary, but final execution additionally requires accepted diagnosis evidence and a separate recovery/no-recovery decision. A final audit never exposes UI by itself; a later separate cutover PR remains required.
