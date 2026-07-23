# ViewLoom permanent category capture specification

Status: source of truth  
Tracking issue: #623  
Kick rollout issue: #634  
Hidden Twitch filter issue: #635  
Initial decision PR: #624

## Purpose

ViewLoom uses permanent provider-separated category capture. Twitch permanent category capture is active and accepted. The next execution stage has two parallel tracks:

1. authorize, implement, deploy, observe, and accept or roll back Kick permanent category capture;
2. implement the Twitch Heatmap category filter behind a disabled feature flag or non-public route while public exposure remains blocked by the seven-day Twitch accumulation gate.

This specification does not authorize historical backfill, retention expansion, cross-provider category identity, combined rankings, or a new Worker cron.

## Current authorization

- Twitch permanent category capture: accepted and active.
- Kick permanent category capture: implementation and guarded rollout authorized; runtime remains inactive until an accepted package, fresh preflight, and exact release trigger.
- Twitch Heatmap category filter: hidden implementation and testing authorized.
- Twitch Heatmap category filter public exposure: not authorized until the seven-day Twitch accumulation audit passes and a separate public cutover PR is accepted.
- Kick category UI: not authorized until Kick permanent capture is accepted and Kick reaches its own stable accumulation gate.

## User-visible effect during parallel implementation

The public site continues to expose the existing Heatmap, Day Flow, Battle Lines, History & Trends, channel pages, and Data Status surfaces without a public category filter.

The hidden Twitch implementation may add API fields, internal state, tests, a disabled feature flag, or a non-public route. It must not add public navigation, default-route controls, or normal production exposure before the public gate.

The intended provider-specific UI order is:

1. Heatmap category filtering;
2. Day Flow category views;
3. category history.

## Provider boundary

- Twitch and Kick remain separate data products.
- Twitch category identifiers use `game_id`; Kick category identifiers use `category.id`.
- Equal-looking provider IDs must never be treated as equal identities.
- Provider databases, collectors, rollups, dictionaries, APIs, routes, URL state, options, and UI results remain isolated.
- Shared UI components may be reused, but provider data and selection state must not be combined.
- Cross-provider category totals, rankings, identity mapping, and automatic equivalence are prohibited.

## Twitch permanent capture contract

Twitch permanent capture must continue to:

- reuse the existing `viewloom-collector-twitch` Worker and Twitch D1 database;
- preserve the existing `*/5 * * * *` Worker cron;
- reuse the accepted `category-source-v1` contract and existing category schema;
- capture category ID and category name inside the existing collection transaction;
- keep stream coverage unchanged;
- introduce no backfill or raw-retention expansion;
- introduce no Kick mutation;
- remain rollbackable to the accepted category-disabled normal Twitch configuration.

## Kick permanent capture contract

The Kick rollout must:

- reuse the existing `viewloom-collector-kick` Worker and Kick D1 database;
- preserve the existing `*/5 * * * *` Worker cron;
- reuse the accepted `category-source-v1` contract and existing category schema;
- capture `category.id` and the provider category name inside the existing collection transaction;
- keep stream coverage unchanged;
- introduce no backfill or raw-retention expansion;
- introduce no Twitch configuration, binding, row, API, or behavior change;
- keep the current category-disabled Kick configuration as the rollback target;
- use a separate accepted package and exact release trigger.

A permanent Kick category flag or equivalent explicit provider-scoped configuration must not authorize or alter Twitch.

## Kick mandatory pre-deployment gates

A fresh read-only production preflight must complete immediately before Kick deployment. It may use Cloudflare `GET` and D1 `SELECT` only and must verify:

- exact Kick Worker and D1 identity;
- normal five-minute cadence;
- required category schema tables;
- provider leakage exactly `0`;
- latest normal Kick snapshot is fresh, real, and non-empty;
- projected Kick 90-day size at or below `440 MB`;
- projected Kick provider headroom at or above `10 MB`;
- projected account-wide D1 headroom at or above `500 MB`;
- Twitch configuration and bindings unchanged;
- no obsolete canary bindings present;
- collector error state clear.

A failed preflight stops deployment.

## Kick post-deployment acceptance

Initial acceptance requires at least two consecutive successful five-minute Kick snapshots that are real, non-empty, category-bearing, fresh, and provider-correct.

The minimum operational observation window is 24 hours. Any warning extends observation to 48 hours or requires rollback. Final Kick acceptance requires:

- category-bearing snapshots continue without replacing normal collection health;
- category dictionary growth is bounded and provider-correct;
- provider leakage remains `0`;
- projected Kick size remains at or below `440 MB`;
- provider headroom remains at or above `10 MB`;
- projected account-wide headroom remains at or above `500 MB`;
- no Twitch mutation occurred;
- no new Worker cron, backfill, retention change, public UI change, or cross-provider behavior was introduced.

## Kick hard-stop and rollback conditions

Rollback is mandatory when any of the following occurs:

- provider leakage exceeds `0`;
- projected Kick 90-day size exceeds `440 MB`;
- Kick provider headroom falls below `10 MB`;
- projected account-wide D1 headroom falls below `500 MB`;
- normal Kick collection becomes stale, non-real, or empty for two consecutive expected cycles;
- category capture causes repeated collector or D1 failures;
- category payload is absent for three consecutive otherwise successful snapshots after deployment;
- Twitch configuration, bindings, rows, APIs, or behavior changes unexpectedly;
- the deployed configuration differs from the accepted Kick-scoped package.

Rollback restores the category-disabled normal Kick configuration and requires read-only proof of normal snapshot recovery and zero leakage.

## Hidden Twitch Heatmap filter contract

Hidden implementation may begin before the seven-day public gate. It must:

- add provider-specific category ID, name, and available-category metadata to the Twitch Heatmap API contract;
- use `All categories` as the default state;
- apply category filtering before Top 20, Top 50, or Top 100 layout selection;
- preserve tile semantics: area equals viewers, color equals momentum, and activity remains a secondary signal;
- preserve selection in a Twitch-specific URL query;
- distinguish loading, empty, partial, stale, demo, unknown-category, and category-unavailable states;
- include desktop, mobile, keyboard, accessibility, API-contract, browser, and regression tests;
- remain behind a disabled feature flag or non-public route;
- preserve the existing unfiltered Heatmap as the fallback;
- change no collector, cron, retention, backfill, Kick data, or cross-provider behavior.

## Twitch public UI gate

Twitch Heatmap category-filter public exposure requires all of the following:

1. seven stable days from the accepted Twitch production start at `2026-07-20T11:40:00Z`;
2. a read-only accumulation audit at or after `2026-07-27T11:40:00Z` covering freshness, category continuity, dictionary continuity, collector errors, provider leakage, and storage headroom;
3. hidden implementation acceptance through Web build, Web checks, Heatmap browser, mobile, accessibility, and data-truth gates;
4. a separate explicit public cutover PR.

The seven-day gate blocks public exposure, not hidden implementation work.

## Kick UI gate

Kick category UI requires final Kick permanent-capture acceptance and a separate stable accumulation gate based only on Kick data. Twitch accumulation must not be reused as Kick evidence.

## Mandatory references

Every category implementation, deployment, observation, acceptance, rollback, hidden UI, public UI, and follow-up PR must read and cite:

- this specification;
- `docs/product/category-capture-permanent-rollout-plan.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- `docs/audits/12a2-current-gate-state.json`;
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
- `docs/operations/development-and-deployment-policy.md`.

The current gate and schedule determine what is authorized. Historical canary and acceptance documents are evidence, not current authorization.