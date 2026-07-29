# ViewLoom permanent category capture rollout plan

Status: source of truth  
Tracking issue: #623  
Hidden Twitch filter issue: #635  
Replacement audit issue: #659

## Outcome

Maintain permanent provider-separated category capture, complete the replacement Twitch seven-day audit, and release the first public provider-specific category filter only through a separate accepted cutover.

Collector cadence remains five minutes. No backfill, retention expansion, D1 schema update, new Worker cron, or cross-provider identity/ranking is part of this plan.

## Completed phases

### 12A-4-19 through 12A-4-23 — Twitch permanent launch and initial acceptance

The permanent Twitch package, exact release, initial verification, minimum observation, final acceptance, and temporary-path retirement completed.

### 12A-4-24 — Kick permanent rollout and hidden Twitch filter

- Kick permanent implementation, release, observation, and final acceptance completed through PR #648.
- Hidden Twitch Heatmap API and controls completed through PRs #638, #640, and #642 without public exposure.

### 12A-5B-R1 — Twitch regression and guarded recovery

- The original seven-day audit in PR #651 detected a production regression and was rejected.
- Provider-scoped deployment protection and a dormant recovery package were accepted in PRs #653 and #654.
- PR #655 triggered Twitch-only recovery.
- Run `30423637234` passed final read-only preflight, permanent-config deployment, and two-snapshot verification.
- PR #657 froze acceptance and retired the one-time recovery paths.
- PR #658 synchronized canonical v33.
- The original clock remains invalid.

## Current phase 12A-5B-R2 — replacement accumulation and parallel safe work

The valid replacement window starts at `2026-07-29T05:30:00.000Z`. The earliest audit is `2026-08-05T05:30:00.000Z`.

### Track A — #659 read-only audit package

Completed:

1. froze `docs/product/twitch-replacement-seven-day-audit-spec.md`;
2. implemented the dormant package in PR #661;
3. fixed the exact half-open window and 2016 five-minute slots;
4. implemented explicit missing-slot accounting with no fake interpolation;
5. implemented category contract/reference/dictionary continuity gates;
6. implemented collector errors, permanent binding, leakage, freshness, storage, public-surface containment, and Kick baseline gates;
7. added sanitized JSON output, pure slot tests, and package CI;
8. accepted the package through PR #662;
9. performed no production change or public exposure.

Next before the boundary:

1. create `work-659-twitch-replacement-audit-checkpoint-package`;
2. keep execution separate from the accepted dormant package;
3. require an exact bounded trigger and checkpoint mode only;
4. run read-only Cloudflare GET, D1 SELECT/WITH, and public-surface checks;
5. freeze sanitized diagnostic evidence;
6. keep checkpoint evidence non-authorizing and add no Worker cron.

At or after the boundary:

1. execute final mode through a separately accepted exact path;
2. freeze exact run/job/artifact/digest identities;
3. accept or reject the complete 2016-slot window;
4. keep public UI disabled.

### Track B — bounded checkpoints

Checkpoints may run before the final audit to detect a hard stop early.

They must be read-only, bounded, provider-specific, non-authorizing, separately accepted, and must not add a Worker cron. A checkpoint cannot replace final #659 evidence or reset the accepted clock.

### Track C — Heatmap Canvas redesign

This work may proceed while accumulation continues after checkpoint-package priority is secured.

PR order:

1. `work-heatmap-canvas-module-split`: separate current responsibilities with no public behavior change.
2. `work-heatmap-canvas-scene`: add Canvas layers, camera state, redraw, hit testing, and overlay behind a hidden route/disabled flag.
3. later interaction and LOD PRs after the first two are accepted.
4. production cutover only after independent final browser/mobile/accessibility/data-truth validation.

Canvas work must preserve current APIs, the unfiltered fallback, provider separation, and hidden category status.

### Track D — provider UI parity #148

The audit-package prerequisite is complete. After checkpoint-package priority is secured:

- compare Twitch/Kick Day Flow and Battle Lines skeletons;
- align controls, chart/detail/KPI ordering, state handling, and Data Status links;
- preserve honest provider-specific data/source/limitation differences;
- do not alter collectors, cadence, category gates, D1 schema, or cross-provider behavior.

## 12A-5C — public Twitch filter cutover

Only after accepted #659 final evidence:

- use a separate PR;
- expose the category control on Twitch Heatmap only;
- retain `All categories` and the unfiltered fallback;
- expose no Kick category UI;
- run production browser, mobile, keyboard, accessibility, fallback, and data-truth checks;
- record exact build and deployed identities.

## Future provider UI sequence

After provider-specific evidence and authorization:

1. Heatmap category filter;
2. Day Flow category views;
3. category history.

## Pull request boundaries and freshness

Each PR must state:

- exact phase and track;
- current-main SHA read;
- current roadmap, schedule, gate, affected specification/plan, and active WIP read;
- provider and paths affected;
- whether Worker config, D1, cron, retention, backfill, API, hidden UI, public UI, routes, navigation, or bindings change;
- targeted and final validation;
- production and rollback boundary;
- public-exposure state;
- exact next branch and stop rule.

If source-of-truth documents are stale or disagree, update them before implementation.
