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
- Checkpoint run `30478338654` failed and evidence/retirement was merged in PR #669.
- Failure diagnosis package PR #670 merged as `7f8e2d5adeec187a194aefc8fb2b239d05c5318a`.
- Failure diagnosis package acceptance PR #671 freezes the read-only query set and diagnostic limitations.

## Checkpoint execution and result

Failed hard stops:

- slot coverage 151/154 = `0.980519`, required `0.995`;
- three consecutive missing slots at `07:20`, `07:25`, `07:30` UTC, allowed maximum two;
- category-reference coverage 45,039/45,287 = `0.994524`, with 248 null references.

The null refs are not invalid indices and are not unresolved dictionary IDs. Runtime safety, bindings, cadence, storage, public containment, latest real/fresh snapshot, zero leakage, and Kick baseline passed.

## Accepted diagnosis package

Authorities:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json`
- `scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs`

Accepted outputs:

- exact presence of the three missing bucket rows;
- collector run history and snapshots around `06:50–08:00 UTC`;
- null refs by bucket and channel;
- checkpoint and post-checkpoint null-ref summaries;
- current collector status;
- static attribution from Helix `game_id` / `game_name` through the category encoder;
- explicit limitation that persisted payloads cannot distinguish which source field was empty because category source fields are stripped after encoding.

The accepted package performs no production diagnosis. D1 statements are `SELECT` / `WITH` only.

## Current gate: one-time failure-diagnosis execution package

Current branch:

`work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package`

The execution package must:

- bind to package PR #670, merge `7f8e2d5adeec187a194aefc8fb2b239d05c5318a`, and acceptance PR #671;
- add a bounded one-time workflow and exact trigger contract;
- use no production credentials or production access on the package PR;
- require a later exact one-file trigger;
- run the accepted diagnosis runner once;
- upload sanitized evidence;
- remain non-authorizing and mutation-free.

## Prohibited responses to checkpoint failure

- checkpoint rerun or threshold relaxation;
- interpolation, backfill, or invented rows;
- automatic Worker/config mutation or stability-clock reset;
- final mode before an accepted diagnosis decision;
- Kick or cross-provider changes;
- public category-filter exposure.

## Final mode

`2026-08-05T05:30:00Z` remains the earliest calendar boundary, but final execution additionally requires accepted diagnosis evidence and a separate recovery/no-recovery decision. A final audit never exposes UI by itself; a later separate cutover PR remains required.
