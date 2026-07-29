# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-29

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Twitch recovery required no
Original Twitch seven-day clock valid no
Replacement Twitch seven-day clock active yes
Replacement Twitch seven-day clock start 2026-07-29T05:30:00.000Z
Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z
Replacement audit issue #659
Dormant replacement audit package accepted yes
Package PR #661
Package acceptance PR #662
Next branch work-659-twitch-replacement-audit-checkpoint-package
Twitch Heatmap public category-filter exposure authorized no
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
D1 schema mutation no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
```

## Recovery acceptance baseline

- Trigger PR: #655; merge `40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4`.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Acceptance PR: #657; merge `5565640b26a0fe8e896e5c47eb054b3363f50463`.
- Canonical synchronization: PR #658; commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Verified replacement start: `2026-07-29T05:30:00.000Z`.
- Earliest audit: `2026-08-05T05:30:00.000Z` / 2026-08-05 14:30 JST.
- Permanent binding present, two consecutive category-bearing snapshots passed, cadence unchanged, leakage zero, storage gates passed, rollback not required, Kick unchanged.

## Accepted audit-package baseline

- Package PR: #661; merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Package validation run/job: `30455002204` / `90586212618`.
- Package acceptance PR: #662.
- Window: `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`.
- Expected slots: 2016.
- Checkpoint mode: implemented, diagnostic, non-authorizing.
- Final mode: implemented, blocked before the exact boundary.
- Production execution in package PR: none.
- Public category controls in production build: absent.

## Execution window: 2026-07-29 through 2026-08-05

### 2026-07-29 — documentation and contracts

Completed:

1. Synchronized roadmap, schedule, specifications, active WIP, contributor entry points, and policy verifiers in PR #660.
2. Accepted `docs/product/twitch-replacement-seven-day-audit-spec.md`.
3. Accepted the Heatmap Canvas redesign specification and implementation plan.
4. Recorded exact next branches and stop rules.

### 2026-07-30 through 2026-07-31 — #659 package first

Completed:

1. Created `work-659-twitch-replacement-audit-package`.
2. Implemented and merged the dormant read-only package in PR #661.
3. Covered the exact accepted start, 2016 five-minute slots, bounded gaps, real/non-empty/fresh category payloads, contract/reference continuity, dictionary resolution, collector errors, permanent binding, leakage, storage gates, public-surface absence, and Kick baseline.
4. Added sanitized JSON output, tests, and package CI without production credentials or mutation.
5. Accepted the package through PR #662.

Next:

1. Create `work-659-twitch-replacement-audit-checkpoint-package`.
2. Add a separate bounded checkpoint execution workflow and exact trigger contract.
3. Keep checkpoint mode diagnostic and non-authorizing.
4. Add no Worker cron; execution must be bounded and explicit.
5. Freeze sanitized checkpoint evidence after the execution path is separately accepted.

Stop rule: do not execute checkpoint credentials from the package PR, do not execute final mode before the boundary, and do not expose category UI.

### 2026-08-01 through 2026-08-04 — checkpoints and independent product work

1. Execute accepted bounded read-only checkpoints that detect hard stops before the final audit.
2. Keep all checkpoint results informational; they do not replace #659.
3. Start `work-heatmap-canvas-module-split` after the checkpoint package is secured.
4. Complete PR-1 responsibility separation with no public behavior change.
5. Start `work-heatmap-canvas-scene` only after PR-1 acceptance; keep it hidden or disabled.
6. Inspect #148 and apply targeted provider-parity fixes; the audit-package prerequisite is complete.
7. Reread current roadmap, schedule, gate, affected specs, and active WIP before each new branch and before each merge.

### 2026-08-05 at or after 05:30 UTC / 14:30 JST

1. Execute the accepted #659 final read-only audit mode.
2. Freeze exact workflow/job/artifact/digest and sanitized evidence.
3. Accept or reject the complete replacement window.
4. Do not expose the category filter from the audit PR.
5. If accepted, prepare a later separate 12A-5C public cutover PR.
6. If rejected, preserve hidden UI and record the exact failure without inventing missing data.

## Public Twitch cutover

Blocked. A later separate PR must cite accepted #659 final evidence, expose only the normal Twitch Heatmap category control, retain `All categories` and the unfiltered fallback, expose no Kick category UI, and pass production browser, mobile, keyboard, accessibility, fallback, and data-truth checks.

## Hard stops

- permanent Twitch binding becomes absent;
- category-bearing collection stops or becomes stale;
- provider leakage exceeds zero;
- projected Twitch 90-day size exceeds 440 MB or provider headroom falls below 10 MB;
- projected account-wide D1 headroom falls below 500 MB;
- any Kick configuration, binding, row, API, UI, or runtime change from Twitch-only work;
- any collector cadence, D1 schema, backfill, retention, or cross-provider change;
- any checkpoint treated as audit acceptance;
- any final-mode execution before `2026-08-05T05:30:00.000Z`;
- any public category-filter exposure before accepted #659 final evidence and separate cutover;
- any Heatmap Canvas production cutover before its own final validation.

## Mandatory references

Every branch and PR in this window must read current-main versions of:

1. `AGENTS.md`;
2. `docs/README.md`;
3. `docs/operations/development-and-deployment-policy.md`;
4. `docs/product/current-roadmap.md`;
5. this schedule;
6. `docs/audits/12a2-current-gate-state.json`;
7. `docs/product/twitch-replacement-seven-day-audit-spec.md`;
8. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`;
9. `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`;
10. the affected feature specification and plan;
11. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
12. relevant immutable acceptance/evidence records.

The PR must record the current-main SHA that was read. If these documents conflict, documentation repair precedes implementation.
