# Japanese Stream Map candidates — J5 contract

Date: 2026-09-11  
Branch: `work-japanese-localization-stream-map-candidates-20260911`  
Stage: J5 hidden candidate only  
Base main: `d5ed2e13ca4875b099a49bfa5812b969c3d7c725`

## Candidate routes

```text
/ja/twitch/map/
/ja/kick/map/
```

Both candidates:

- use `<html lang="ja">`;
- use `noindex,follow`;
- self-canonicalize to the Japanese route;
- remain absent from sitemap and public hreflang;
- do not expose the public language switcher before J10;
- reuse the existing provider-specific Map APIs and data contracts.

## Runtime ownership

Twitch remains owned by the existing shared Stream Map runtime:

```text
maplibre-bootstrap.ts
-> geography-ui-bootstrap.ts
-> city-render-guard.ts
-> country-minimal-basemap.ts
-> country-regions.ts
-> stream-map-entry.ts
-> data-error-state-guard.ts
-> country-ui-density.ts
```

The API remains `/api/twitch-stream-map`; `?geography=city` remains the existing explicit City mode.

Kick remains owned by:

```text
public-entry.ts
-> public-kc5-entry.ts
```

The APIs remain `/api/kick-stream-map` and `/api/kick-stream-map?geography=city`.

`stream-map-ja-presentation.ts` is a locale-gated presentation adapter. It owns no fetch call, API route, geography decision, evidence decision, D1 binding, collector behavior, or retention/cadence behavior.

## Geography and evidence boundaries

J5 does not change any geography semantics.

- Country remains Country.
- Twitch City continues to use the existing accepted home/base or declared-location evidence contract.
- Kick Base City continues to use the separate reviewed Kick-only City contract.
- Country-only evidence is never promoted to City.
- Current / IRL is not promoted from Home/Base, Country, City, event venue, planned travel, or inferred cues.
- Creator addresses, GPS coordinates, or inferred creator coordinates are not introduced.
- Aggregate reference geometry remains an aggregate UI target, not a creator location claim.
- `no_geometry` remains list-only where the existing City contract requires it.
- Existing fail-closed behavior remains authoritative.

## Translation boundary

Translate presentation chrome only: controls, headings, filter labels, explanatory copy, loading/error/empty states, legends, counts and accessibility labels.

Keep raw/provider data unchanged, including:

- streamer/channel identity;
- country and city names emitted by the runtime;
- category names emitted by the provider/runtime;
- reason codes;
- stable IDs and internal keys;
- raw provider text and internal enums.

The shared Japanese adapter explicitly protects the relevant dynamic DOM nodes before translating text.

## Kick bootstrap compatibility

The current Kick shared runtime initially locates the Country and City controls using their literal text before it retains element references. Therefore the Japanese Kick candidate intentionally keeps the initial static button text `Country` and `City` while retaining `data-kick-geography="country|city"`.

The Japanese presentation adapter translates those labels only after the existing Kick runtime has initialized. This preserves shared runtime behavior without forking or weakening the geography controller.

## Current inventory target

```text
Vite HTML inputs                 40
inventory entries incl. 404      41
indexable routes                 23
noindex routes                   17
sitemap routes                   23
Japanese hidden candidates       13
browser viewports                 4
browser scenarios               160
```

Historical K4, Phase 12, and R12A route/count evidence remains frozen at its accepted historical values and is not rewritten by J5.

## QA owners

- `apps/web/scripts/verify-japanese-home-candidates.mjs`
- `scripts/verify-public-surface-inventory.mjs`
- `scripts/verify-public-browser-audit-current.mjs`
- `scripts/verify-public-current-browser-audit.mjs`
- `.github/workflows/public-browser-audit.yml`
- `.github/workflows/production-smoke-pr.yml`
- `.github/workflows/production-smoke.yml`
- existing Twitch Stream Map geography/accessibility/data-state audits
- existing Kick Stream Map public-readiness contracts

## Explicit non-authorization

This J5 candidate does not authorize production collector changes, collector cadence changes, D1 schema/write/binding changes, retention/backfill changes, reviewed-evidence acceptance changes, Current / IRL activation, creator-coordinate publication, cross-provider aggregation, or J10 public Japanese indexing/release.
