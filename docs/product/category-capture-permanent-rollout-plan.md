# ViewLoom permanent category capture rollout plan

Status: source of truth  
Tracking issue: #623  
Kick rollout issue: #634  
Hidden Twitch filter issue: #635  
Initial decision PR: #624

## Outcome

Complete permanent provider-separated category capture and the first provider-specific category filter without changing five-minute collector cadence, adding backfill, expanding retention, or combining Twitch and Kick.

The current work is parallel:

- Track A: guarded Kick permanent-category rollout;
- Track B: hidden Twitch Heatmap category-filter implementation;
- public Twitch exposure remains blocked until the seven-day Twitch accumulation audit and a separate public cutover PR.

## Completed phases

### Phase 12A-4-19 — Twitch-first decision and contract

Accepted the permanent capture specification, provider boundaries, rollback rules, and mandatory documentation references.

### Phase 12A-4-20 — Twitch implementation package

Accepted the Twitch permanent configuration, category-disabled rollback configuration, read-only preflight, and observation tooling.

### Phase 12A-4-21 — exact Twitch deployment

Accepted the exact trigger, fresh preflight, production publish, deployed identity, and two consecutive category-bearing Twitch snapshots.

### Phase 12A-4-22 — Twitch 24-hour observation

Observed Twitch for the minimum 24 hours with no warning or hard stop.

### Phase 12A-4-23 — Twitch final acceptance

Accepted Twitch permanent category capture with 291 observed category snapshots against 290 expected, 100% coverage, zero collector errors, zero leakage, and passing storage and freshness gates. Temporary release and observation paths were retired.

## Current phase 12A-4-24 — parallel Kick rollout and hidden Twitch filter

This phase authorizes two separate workstreams. Each PR must identify its track and must not silently cross into the other track.

## Track A — Kick permanent category capture

### 12A-4-24A — decision and package preparation

- accept the Kick-only permanent rollout decision contract;
- run a fresh read-only Kick preflight;
- prepare an explicit Kick permanent-category configuration;
- preserve the current Kick configuration as rollback;
- test category extraction, dictionary writes, payloads, provider separation, and rollback;
- validate collector typecheck and normal/permanent dry-run bundles;
- perform no production deployment from the implementation PR.

### 12A-4-24B — exact Kick release package

After the implementation package is accepted:

1. create a separate dormant release package;
2. require a fresh Cloudflare GET / D1 SELECT preflight;
3. stop on any storage, leakage, identity, schema, freshness, or provider failure;
4. use an exact one-file trigger on main;
5. publish only the accepted Kick-scoped configuration;
6. verify two consecutive real, non-empty, category-bearing Kick snapshots;
7. restore normal Kick configuration and verify recovery on failure.

### 12A-4-24C — Kick 24–48 hour observation

Observe for at least 24 hours. Extend to 48 hours on a warning without a hard stop.

Check:

- latest Kick snapshot freshness, source mode, stream count, and viewer total;
- category-bearing snapshot continuity;
- Kick dictionary growth;
- provider leakage;
- current and projected Kick D1 size;
- provider and account-wide headroom;
- collector and D1 errors;
- Twitch configuration, data, API, and runtime immutability.

A temporary GitHub Actions schedule is permitted. A new Worker cron is not.

### 12A-4-24D — Kick acceptance or rollback closeout

On success:

- freeze sanitized final evidence;
- record workflow, job, artifact, digest, package, trigger, and deployment identities;
- advance canonical state to Kick permanent category capture accepted;
- retire all temporary trigger and observation paths.

On failure:

- restore normal category-disabled Kick configuration;
- prove normal five-minute collection recovered;
- prove permanent Kick category capture stopped;
- prove provider leakage remains zero;
- freeze failure and rollback evidence.

## Track B — hidden Twitch Heatmap category filter

### 12A-5A — hidden implementation package

This work may proceed immediately and in parallel with Track A.

- extend the Twitch Heatmap API contract with category ID, category name, and available-category options;
- add `All categories` as the default;
- filter before Top 20 / 50 / 100 selection and layout;
- preserve tile semantics and unfiltered fallback;
- persist Twitch category selection in URL state;
- implement explicit loading, empty, partial, stale, demo, unknown-category, and unavailable states;
- add desktop, mobile, keyboard, accessibility, API-contract, browser, and regression coverage;
- keep the feature behind a disabled flag or non-public route;
- add no public navigation or default-route exposure.

### 12A-5B — seven-day Twitch accumulation audit

At or after `2026-07-27T11:40:00Z`, run a read-only audit covering:

- category-bearing snapshot continuity since `2026-07-20T11:40:00Z`;
- collector errors;
- provider leakage;
- category dictionary continuity and bounded growth;
- snapshot freshness and real/non-empty state;
- projected Twitch and account-wide storage headroom;
- public UI still disabled during the audit.

### 12A-5C — public Twitch filter cutover

Public exposure requires both the accumulation audit and hidden implementation package to be accepted. Use a separate PR to:

- enable the production flag or normal route;
- expose the category control on Twitch Heatmap only;
- retain the unfiltered fallback;
- verify production browser, mobile, accessibility, and data-truth behavior;
- leave Kick UI unchanged.

## Future provider UI sequence

After each provider has its own accepted permanent capture and stable accumulation evidence:

1. provider-specific Heatmap category filter;
2. provider-specific Day Flow category views;
3. provider-specific category history.

Shared components are allowed. Shared provider identity, totals, rankings, or automatic mapping are not.

## Pull request boundaries

Each category PR must state:

- the exact phase and track;
- the provider affected;
- the mandatory source documents read;
- whether Worker config, D1, cron, retention, backfill, API, hidden UI, public UI, routes, navigation, or bindings change;
- exact validation and production evidence;
- rollback behavior;
- public-exposure state;
- temporary paths that must later be retired.