# ViewLoom permanent category capture specification

Status: source of truth  
Tracking issue: #623  
Hidden Twitch filter issue: #635  
Replacement audit issue: #659  
Current canonical gate: `viewloom-12a2-current-gate-state-v33`

## Purpose

ViewLoom uses permanent provider-separated category capture for Twitch and Kick on their existing five-minute collectors.

Current state:

- Twitch permanent category capture: accepted, recovered, and active.
- Kick permanent category capture: accepted and active.
- Twitch Heatmap category filter: hidden implementation accepted.
- Twitch Heatmap category-filter public exposure: unauthorized.
- Replacement Twitch stability start: `2026-07-29T05:30:00.000Z`.
- Earliest replacement read-only audit: `2026-08-05T05:30:00.000Z`.

This specification does not authorize historical backfill, retention expansion, cross-provider category identity, combined rankings, a new Worker cron, collector cadence change, or public category UI.

## Current authorization

- Preserve both permanent provider configurations and existing `*/5 * * * *` cadences.
- Build and verify the dormant read-only #659 audit package before the audit boundary.
- Use bounded read-only checkpoints to detect a broken accumulation window early.
- Continue hidden Twitch Heatmap implementation and renderer work without public exposure.
- Begin Heatmap Canvas module separation and hidden scene work because it does not depend on category public authorization.
- Address provider UI parity independently when it does not change collectors, D1, category authorization, or provider boundaries.
- Public Twitch category-filter cutover remains blocked until #659 passes and a separate explicit PR is accepted.
- Kick category UI requires separate Kick-specific evidence and authorization.

## Provider boundary

- Twitch and Kick remain separate data products.
- Twitch category identifiers use `game_id`; Kick identifiers use `category.id`.
- Equal-looking provider IDs are not equal identities.
- Provider databases, collectors, rollups, dictionaries, APIs, routes, URL state, options, and UI results remain isolated.
- Shared UI components are allowed; shared provider data, selection state, totals, rankings, and automatic category mapping are prohibited.

## Permanent capture contract

Both providers must:

- reuse their existing collector Worker and D1 database;
- preserve the existing `*/5 * * * *` Worker cron;
- use the accepted `category-source-v1` contract and existing category schema;
- capture provider category ID and name inside the normal collection transaction;
- keep stream coverage unchanged;
- introduce no backfill or raw-retention expansion;
- remain rollbackable to the accepted category-disabled normal provider configuration;
- never authorize or change the other provider.

## Replacement Twitch accumulation contract

The current valid window begins at `2026-07-29T05:30:00.000Z`. The original window beginning on 2026-07-20 is invalid and cannot authorize public UI.

The final #659 audit must be read-only and must verify:

- at least seven elapsed days from the accepted recovery start;
- every expected five-minute slot or explicit bounded-gap accounting without interpolation;
- real, non-empty, fresh, structurally valid category-bearing snapshots;
- `category-source-v1` continuity;
- valid category references and zero unresolved observed category IDs;
- bounded dictionary growth and usable names;
- permanent Twitch binding present and obsolete canary bindings absent;
- acceptable collector-error history;
- provider leakage exactly zero;
- Twitch projected 90-day size at or below 440 MB;
- Twitch provider headroom at or above 10 MB;
- projected account-wide D1 headroom at or above 500 MB;
- hidden controls absent from normal public Twitch and Kick surfaces;
- Kick configuration, rows, routes, APIs, UI, and runtime unchanged.

The audit may use Cloudflare `GET`, D1 `SELECT`/read-only CTEs, repository files, and public-surface checks. It must not write D1, deploy Workers, alter bindings, or expose UI.

## Bounded checkpoint contract

Before the final audit, bounded read-only checkpoints may verify the same health signals over the partial window.

A checkpoint:

- is diagnostic only;
- does not reset or accept the seven-day clock;
- does not authorize public UI;
- does not add a Worker cron;
- must freeze sanitized output if retained;
- must report hard stops immediately.

## Hidden Twitch Heatmap filter contract

The accepted hidden implementation must:

- provide provider-specific category ID, name, and available-category metadata;
- use `All categories` as the default;
- filter before Top 20/50/100 layout selection;
- preserve tile semantics and the unfiltered fallback;
- persist Twitch-specific URL state;
- distinguish loading, empty, partial, stale, demo, unknown-category, unavailable, and error states;
- include desktop, mobile, keyboard, accessibility, API-contract, browser, fallback, and regression coverage;
- remain behind a disabled flag or non-public route until cutover;
- change no collector, cron, retention, backfill, Kick data, or cross-provider behavior.

The seven-day gate blocks public exposure, not hidden implementation work.

## Heatmap Canvas boundary

Canvas/Camera/LOD work is authorized as independent renderer and interaction work.

It may:

- split current Heatmap responsibilities;
- add Canvas layers, camera state, redraw, hit testing, selection overlay, and LOD;
- run behind a hidden route or disabled flag;
- preserve current API and unfiltered production behavior.

It may not:

- expose the hidden category filter;
- change collector or category capture behavior;
- change public semantics without a separately accepted cutover;
- remove the existing fallback before final browser/mobile/accessibility/data-truth acceptance.

## Public Twitch UI gate

Public exposure requires all of the following:

1. seven stable days from `2026-07-29T05:30:00.000Z`;
2. accepted #659 read-only evidence at or after `2026-08-05T05:30:00.000Z`;
3. accepted hidden implementation and current production validation;
4. a separate explicit public cutover PR.

A passing audit does not itself expose the feature.

## Mandatory references and freshness

Every category, checkpoint, audit, hidden UI, Canvas, public UI, or related follow-up PR must read current-main versions of:

- this specification;
- `docs/product/category-capture-permanent-rollout-plan.md`;
- `docs/product/twitch-replacement-seven-day-audit-spec.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- `docs/audits/12a2-current-gate-state.json`;
- the affected feature specification and implementation plan;
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
- `docs/operations/development-and-deployment-policy.md`.

The current gate and schedule determine authorization. Historical evidence records what happened but does not override current authorization.
