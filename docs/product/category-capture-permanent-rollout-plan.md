# ViewLoom permanent category capture rollout plan

Status: source of truth  
Tracking issue: #623  
Decision PR: #624

## Outcome

Deliver permanent provider-separated category capture without changing the five-minute collector cadence, adding backfill, expanding retention, changing public UI, or combining Twitch and Kick.

## Phase 12A-4-19 — decision and contract

This phase:

- accepts the permanent category capture specification;
- authorizes Twitch-only implementation;
- keeps Kick unauthorized;
- records operational gates and rollback rules;
- updates the roadmap, schedule, canonical gate, development policy, and policy verifier;
- makes the specification and plan mandatory references for later work.

No production configuration or runtime behavior changes in this phase.

## Phase 12A-4-20 — Twitch implementation package

Prepare a completed Twitch-only package that:

- reuses the existing collector, D1 database, category schema, and `category-source-v1` contract;
- enables category capture through explicit Twitch-scoped configuration;
- preserves `*/5 * * * *`;
- includes tests for extraction, dictionary writes, snapshot payloads, provider separation, and disabled Kick behavior;
- includes a category-disabled rollback configuration;
- includes a fresh read-only preflight runner;
- includes a temporary read-only observation and hard-stop package;
- performs no production deployment from the implementation PR.

## Phase 12A-4-21 — exact Twitch deployment

Use a separate exact deployment trigger after the implementation package is accepted. Mandatory order:

1. inspect exact package and trigger identities;
2. run a fresh Cloudflare GET / D1 SELECT preflight;
3. stop if any storage, leakage, binding, schema, freshness, or provider gate fails;
4. deploy Twitch permanent category capture;
5. verify the deployed provider-scoped configuration;
6. verify two consecutive real, non-empty, category-bearing snapshots;
7. begin the bounded observation window.

## Phase 12A-4-22 — Twitch 24–48 hour observation

Observe for a minimum of 24 hours. Extend to 48 hours when a warning appears but no hard stop has fired.

Check at regular intervals:

- latest Twitch snapshot freshness, source mode, stream count, and viewer total;
- category-bearing snapshot continuity;
- Twitch dictionary growth;
- provider leakage;
- current and projected D1 size;
- provider and account-wide headroom;
- collector failures and D1 errors;
- Kick configuration and data immutability.

A temporary GitHub Actions observation schedule is allowed, but no new Worker cron is allowed. Temporary observation paths must be retired after acceptance or rollback.

## Phase 12A-4-23 — Twitch acceptance or rollback closeout

On success:

- freeze sanitized final evidence;
- record exact workflow, job, artifact, and digest identities;
- advance the canonical gate to Twitch permanent category capture accepted;
- retire temporary deployment triggers and observation workflows;
- keep Kick unauthorized pending a separate decision.

On failure:

- restore the category-disabled normal Twitch configuration;
- prove normal five-minute collection recovered;
- prove category capture stopped;
- prove provider leakage remains zero;
- freeze failure and rollback evidence;
- leave Twitch permanent capture unaccepted until a repair package is approved.

## Phase 12A-4-24 — Kick decision

After Twitch final acceptance, evaluate Kick separately. Twitch acceptance does not automatically authorize Kick.

## Phase 12A-5 — stable accumulation and category UI

After every provider included in the UI has at least seven stable days of accepted category data:

1. specify and implement provider-specific Heatmap category filtering;
2. specify and implement provider-specific Day Flow category views;
3. specify and implement provider-specific category history;
4. retain explicit Twitch/Kick labels and separate routes/data requests;
5. do not introduce combined provider rankings.

## Pull request boundaries

Each PR must state:

- which phase it satisfies;
- which provider it affects;
- whether Worker config, D1, cron, retention, backfill, UI, or bindings change;
- exact checks and production evidence required;
- rollback behavior;
- which temporary paths must later be retired.
