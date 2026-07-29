# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659  
Parent issue: #623  
Hidden UI issue: #635  
Canonical start: `2026-07-29T05:30:00.000Z`  
Earliest execution: `2026-08-05T05:30:00.000Z`

## Purpose

Define the accepted dormant read-only package, runner repair, checkpoint behavior, final execution, evidence, acceptance, and failure handling for the replacement Twitch seven-day category accumulation audit.

The audit decides only whether the hidden Twitch Heatmap category filter is eligible for a later separate public-cutover PR. It does not expose UI.

## Accepted baseline

- Recovery trigger PR: #655.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Recovery acceptance PR: #657.
- Canonical synchronization: PR #658 / commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Permanent Twitch binding: present.
- Existing cadence: `*/5 * * * *`.
- Provider leakage at recovery: zero.
- Kick change at recovery: none.

## Accepted dormant package

- Package PR: #661.
- Package candidate head: `9d593116e2cccc40dc27bc42b3be55d647e3d3ae`.
- Package merge: `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Validation run/job: `30455002204` / `90586212618`.
- Package acceptance PR: #662.
- Contract: `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`.
- Acceptance: `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`.
- Window semantics: half-open.
- Exact window: `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`.
- Expected five-minute slots: 2016.
- Production execution included: no.
- Public category-filter exposure authorized: no.

## Runner repair before checkpoint execution

Pre-execution review found defect `sqlite_cte_scope_cross_statement` in the accepted dormant runner.

The original query defined CTE `scoped` in one SQL statement and referenced it from a later independent statement used to enumerate observed slots. SQLite CTE scope ends with the defining statement, so production checkpoint execution would fail before evidence completion.

No production checkpoint or final audit executed before detection.

Repair requirements:

- branch `work-659-twitch-replacement-audit-runner-query-fix`;
- export a pure SQL builder for direct regression inspection;
- enumerate observed category slots directly from `minute_snapshots`;
- retain `provider = 'twitch'`, exact half-open window predicates, and `category-source-v1`;
- require every SQL statement to start with `SELECT` or `WITH`;
- prohibit any later statement from using `FROM scoped`;
- preserve the exact 2016-slot window, checkpoint/final semantics, thresholds, evidence schema, and non-authorizing boundaries;
- use no production credentials or Cloudflare/D1 execution in the repair PR;
- freeze a separate repair acceptance record before checkpoint-package work resumes.

The checkpoint execution package is blocked until this repair is accepted on main.

## Package boundary

The accepted package and its repair remain dormant and read-only.

Allowed:

- repository validation;
- Cloudflare `GET` only through a separately accepted execution path;
- D1 `SELECT` and read-only CTEs only through a separately accepted execution path;
- public HTTP/HTML checks;
- sanitized JSON artifact generation;
- fixture/unit/static verification;
- Wrangler dry-run if no publish occurs.

Forbidden:

- Worker deployment;
- D1 writes or schema changes;
- binding or secret changes;
- cron/cadence changes;
- backfill or retention changes;
- public category UI exposure;
- Kick changes;
- cross-provider data or identity behavior.

## Window identity

The only valid start is `2026-07-29T05:30:00.000Z`.

The final audit must reject:

- an earlier historical start;
- an inferred start from the first row when it differs from the accepted boundary;
- a window shorter than seven elapsed days;
- a future or unverified boundary;
- replacement of missing slots with interpolated data.

## Required evidence

### Slot continuity

- expected five-minute slots across the complete accepted window;
- observed category-bearing slots;
- exact missing-slot timestamps;
- duplicates or invalid/out-of-window buckets;
- coverage ratio;
- maximum consecutive missing slots;
- explicit bounded-gap decision.

### Payload and category integrity

- real, non-empty, fresh snapshots;
- `category-source-v1` continuity;
- stream count and viewer totals for the latest snapshot;
- category-bearing row count;
- valid category references;
- zero unresolved observed category IDs;
- dictionary names present where required;
- bounded dictionary growth.

### Runtime and provider integrity

- permanent binding present and value true;
- obsolete canary bindings absent;
- collector cadence unchanged;
- acceptable collector-error history;
- provider leakage zero;
- Kick configuration/runtime baseline unchanged.

### Storage

- current Twitch database size;
- projected 90-day size at or below 440 MB;
- provider headroom at or above 10 MB;
- projected account-wide D1 headroom at or above 500 MB.

### Public-surface containment

- normal public Twitch Heatmap has no category control before cutover;
- public navigation does not expose the hidden entry;
- Kick public pages expose no Twitch category control;
- existing unfiltered Heatmap fallback remains usable.

## Checkpoint mode

A checkpoint may run before the final boundary only after runner repair acceptance and separate checkpoint-package acceptance.

It must:

- use the accepted start and latest completed five-minute boundary capped at the final end;
- report current slot coverage, exact gaps, and hard stops;
- remain read-only;
- run only through a separately accepted bounded execution path;
- never mark the seven-day audit accepted;
- never authorize public UI;
- never add a Worker cron;
- produce sanitized output when retained.

Checkpoint evidence is diagnostic. A checkpoint cannot accept #659 or authorize public UI. A healthy checkpoint does not guarantee final acceptance, and a failed checkpoint does not authorize automatic mutation.

## Final mode

Final mode:

- is prohibited before `2026-08-05T05:30:00.000Z`;
- requires accepted runner repair and a separately accepted final execution path;
- uses the exact accepted half-open 2016-slot window;
- requires every final hard gate;
- performs no deployment or D1 mutation;
- requires a separate evidence-acceptance PR after execution;
- never exposes UI by itself.

## Acceptance

Final acceptance requires every hard gate to pass or an explicitly documented bounded gap that the accepted policy permits without inventing data.

Accepted evidence must record:

- source package, repair, and execution identities;
- workflow run and job;
- artifact ID and digest;
- exact observation time;
- accepted start/end;
- slot counts and gaps;
- payload/reference/dictionary result;
- binding/cadence/errors/leakage result;
- storage result;
- public-surface containment;
- Kick unchanged;
- public cutover still unauthorized.

A passing audit does not itself expose the feature.

## Failure

On failure:

- perform no deployment because the audit is read-only;
- keep the hidden UI non-public;
- record the exact failed gate and sanitized evidence;
- preserve the existing unfiltered Heatmap;
- decide separately whether collector recovery work is required;
- do not reset the clock without a separately verified recovery event.

## Retirement

Temporary repair/checkpoint/final execution paths must be retired after their bounded purpose, unless an accepted follow-up contract explicitly retains a reusable read-only verifier. The repaired dormant runner and pure tests may remain only while they are current authorities for #659.
