# ViewLoom permanent category capture specification

Status: source of truth  
Tracking issue: #623  
Decision PR: #624

## Purpose

ViewLoom will move from completed bounded category canaries to permanent provider-separated category capture. The first production rollout is Twitch only. Kick remains disabled until Twitch reaches a separate final acceptance and a later explicit Kick decision is merged.

This specification governs collection and storage only. It does not authorize category analytics UI, historical backfill, retention expansion, cross-provider category identity, combined rankings, or a new Worker cron.

## User-visible effect during capture rollout

The public site continues to expose the existing Heatmap, Day Flow, Battle Lines, History & Trends, channel pages, and Data Status surfaces. No category filter or category page is added during this phase.

The intended UI order after stable accumulation is:

1. provider-specific Heatmap category filtering;
2. provider-specific Day Flow category views;
3. provider-specific category history.

## Provider boundary

- Twitch and Kick remain separate data products.
- Twitch category identifiers use `game_id`; Kick category identifiers use `category.id`.
- Equal-looking provider IDs must never be treated as equal identities.
- Provider databases, collectors, rollups, dictionaries, APIs, and future UI filters remain isolated.
- Cross-provider category totals, rankings, identity mapping, and automatic equivalence are prohibited.

## Twitch permanent capture contract

The Twitch rollout must:

- reuse the existing `viewloom-collector-twitch` Worker and Twitch D1 database;
- preserve the existing `*/5 * * * *` Worker cron;
- reuse the accepted `category-source-v1` contract and existing category schema;
- capture category ID and category name inside the existing collection transaction;
- keep stream coverage unchanged;
- introduce no backfill or raw-retention expansion;
- introduce no Kick change;
- remain rollbackable to the current category-disabled normal Twitch configuration.

A permanent Twitch category flag or equivalent explicit provider-scoped configuration may be introduced only by the Twitch implementation and deployment package. It must not authorize Kick.

## Mandatory pre-deployment gates

A fresh read-only production preflight must complete immediately before deployment. It may use Cloudflare `GET` and D1 `SELECT` only and must verify:

- exact Twitch Worker and D1 identity;
- normal five-minute cadence;
- required category schema tables;
- provider leakage exactly `0`;
- latest normal Twitch snapshot is fresh, real, and non-empty;
- projected Twitch 90-day size at or below `440 MB`;
- projected Twitch provider headroom at or above `10 MB`;
- projected account-wide D1 headroom at or above `500 MB`;
- Kick configuration and bindings unchanged;
- no obsolete canary bindings present.

A failed preflight stops deployment.

## Post-deployment acceptance

Initial acceptance requires at least two consecutive successful five-minute Twitch snapshots that are real, non-empty, category-bearing, fresh, and provider-correct.

The minimum operational observation window is 24 hours. Any warning extends observation to 48 hours or requires rollback. Final Twitch acceptance requires:

- category-bearing snapshots continue without replacing normal collection health;
- category dictionary growth is bounded and provider-correct;
- provider leakage remains `0`;
- projected Twitch size remains at or below `440 MB`;
- provider headroom remains at or above `10 MB`;
- projected account-wide headroom remains at or above `500 MB`;
- no Kick mutation occurred;
- no new Worker cron, backfill, retention change, UI change, or cross-provider behavior was introduced.

## Hard-stop and rollback conditions

Rollback is mandatory when any of the following occurs:

- provider leakage exceeds `0`;
- projected Twitch 90-day size exceeds `440 MB`;
- Twitch provider headroom falls below `10 MB`;
- projected account-wide D1 headroom falls below `500 MB`;
- normal Twitch collection becomes stale, non-real, or empty for two consecutive expected cycles;
- category capture causes repeated collector or D1 failures;
- category payload is absent for three consecutive otherwise successful snapshots after deployment;
- Kick configuration, bindings, rows, or behavior changes unexpectedly;
- the deployed configuration differs from the accepted provider-scoped package.

Rollback restores the category-disabled normal Twitch configuration and requires read-only proof of recovery and zero leakage.

## Kick gate

Kick permanent category capture is not authorized by this specification. A Kick rollout requires Twitch final acceptance, frozen closeout evidence, a separate Kick decision PR, a fresh Kick preflight, and a separate deployment and observation package. Twitch acceptance must not start Kick automatically.

## UI gate

Category UI remains unauthorized until the included providers have accepted permanent capture and at least seven stable days of provider-separated category data. Missing, partial, stale, empty, error, and demo states must be specified before UI implementation.

## Mandatory references

Every category implementation, deployment, observation, acceptance, rollback, and UI PR must read and cite:

- this specification;
- `docs/product/category-capture-permanent-rollout-plan.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- `docs/audits/12a2-current-gate-state.json`;
- `docs/operations/development-and-deployment-policy.md`.

The current gate and schedule determine what is authorized. Historical canary documents are evidence, not current authorization.
