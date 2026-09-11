# ViewLoom Japanese localization implementation plan v0.1

Status: active implementation plan for Japanese localization  
Governing spec: `docs/product/japanese-localization-spec-v0.1.md`  
Work class: parallel frontend/SEO lane  
Initial branch: `work-japanese-localization-foundation-20260909`  
Initial main baseline: `f32b2b939285329a979d32c0af8f84ebb0b7a335`  

## 1. Scheduling rule

Japanese localization runs in parallel with Stream Map and other provider/data work.

A blocked Map, collector, reviewed-evidence, or Current/IRL dependency does not block safe localization work. Localization likewise does not authorize or delay collector/data changes.

The public English site remains unchanged until the final Japanese release gate.

## 2. Stage plan

### J0 — localization contract and inventory

Work:

- freeze `/ja/` route model;
- define translation/non-translation boundaries;
- define UTC/timezone behavior;
- define feature-name/glossary rules;
- inventory all current public HTML routes and shared shells;
- record intentionally non-localized raw/provider data.

Outcome:

Japanese work has one deterministic contract and does not drift page by page.

### J1 — i18n foundation

Work:

- add `src/i18n/locale.ts`;
- add locale message catalogs;
- add translation lookup/interpolation helper;
- add locale-aware formatting helpers with explicit UTC semantics;
- add locale-aware route helper preserving query/hash where valid;
- keep foundation unused by production UI until a page migration branch deliberately adopts it.

Outcome:

Pages can migrate away from hardcoded UI English without cloning Twitch/Kick renderers.

### J2 — shared shell

Work:

- global header/navigation;
- footer;
- mobile menu copy;
- shared status copy;
- language switcher component implemented but public-hidden;
- shared document `lang`/metadata utilities.

Outcome:

One shared shell can render English or Japanese.

### J3 — Portal and provider homes

Routes:

```text
/ja/
/ja/twitch/
/ja/kick/
```

Work:

- Portal copy;
- Twitch provider home;
- Kick provider home;
- localized metadata;
- temporary Japanese noindex;
- route-switch preservation.

Historical implementation state (2026-09-10):

- `/ja/`, `/ja/twitch/`, and `/ja/kick/` were introduced as hidden candidates;
- all self-canonicalize and remain `noindex,follow` before J10;
- Japanese candidates remain excluded from sitemap, public hreflang, and the public language switcher;
- provider homes reuse the same renderer and existing provider-specific APIs/D1 bindings.

Outcome:

The Japanese entry hierarchy is complete but not publicly advertised.

### J4 — core analysis features

Migrate both providers for:

- Heatmap;
- Day Flow;
- Battle Lines;
- History / History & Trends.

Current state (2026-09-11):

- Twitch/Kick Heatmap, Day Flow, Battle Lines, and History candidates are implemented;
- J4d History merged through PR #1310 at main `d5ed2e13ca4875b099a49bfa5812b969c3d7c725`;
- shared feature controllers and provider-specific APIs remain authoritative;
- raw streamer/provider data stays untranslated;
- UTC data-day semantics remain unchanged;
- all Japanese J4 surfaces remain hidden/noindex before J10.

Outcome:

The primary ViewLoom analysis experience has Japanese parity.

### J5 — Stream Map

Migrate both providers for:

- Country/City geography controls;
- population/evidence/filter labels;
- mapped/unmapped/excluded/conflict presentation copy;
- map legends;
- selected geography/result panels;
- loading/error/unavailable states;
- accessibility labels.

Do not change geography/evidence semantics.

Merged state (2026-09-11):

- `/ja/twitch/map/` and `/ja/kick/map/` were implemented on `work-japanese-localization-stream-map-candidates-20260911` and merged through PR #1312;
- J5 merge main is `6751f0acc95719d5fea4f87b5938b4301d9607f1`;
- both are `noindex,follow`, self-canonical, excluded from sitemap/hreflang/public language switching;
- Twitch reuses `maplibre-bootstrap.ts`, `geography-ui-bootstrap.ts`, `stream-map-entry.ts`, and the existing `/api/twitch-stream-map` Country/City contract;
- Kick reuses `public-entry.ts` / `public-kc5-entry.ts` and existing `/api/kick-stream-map` Country/City contracts;
- one locale-gated `stream-map-ja-presentation.ts` adapter translates presentation copy after the existing runtimes render and owns no API path or network request;
- streamer names, country/city names, runtime category names, reason codes, stable IDs, and other raw/provider data remain untranslated;
- Country, Base City, City, and Current / IRL semantics are unchanged; Current / IRL remains unavailable where the existing product contract keeps it unavailable;
- no creator coordinates, inferred location, collector, D1, cadence, retention, or geography acceptance rule is introduced;
- J5 closed at 40 HTML routes plus explicit 404, 41 inventory entries, 17 noindex routes, 23 sitemap routes, 13 Japanese candidates, and 160 browser scenarios across four viewports;
- public exposure/indexing still remains forbidden until J10.

Outcome:

Japanese localization covers the current main product program without forking Map logic.

### J6 — utility/deep routes

Migrate:

- Data Status;
- Channel;
- Local Watchlist;
- other public utility routes present in the current route inventory.

Execution order:

```text
J6a — Data Status
J6b — Channel
J6c — Local Watchlist
```

Candidate-complete state (2026-09-11):

- J6a Data Status merged through PR #1315 with hidden `/ja/twitch/status/` and `/ja/kick/status/` candidates;
- Data Status reuses `status-current-shell-entry.ts` and the existing provider-separated `/api/twitch-status` / `/api/kick-status` contracts; `status-ja-presentation.ts` owns presentation only;
- J6b Channel merged through PR #1324 at main `b15358d7d05baed108b5599ae1117ddf9970045c`, adding hidden `/ja/twitch/channel/` and `/ja/kick/channel/` candidates;
- Channel reuses `channel-profile.ts`, the existing provider-separated `/api/history` / `/api/kick-history` endpoints, and the existing query-state URL contract;
- `channel-ja-presentation.ts` owns no network request or API path and protects raw channel identity/external provider links while localizing rendered presentation copy;
- J6c Local Watchlist is implemented in PR #1326 with hidden `/ja/twitch/watchlist/` and `/ja/kick/watchlist/` candidates;
- Local Watchlist reuses the existing provider-specific `localStorage` contract, `watchlist-page.ts`, and the existing bounded Heatmap/History request ownership; no account, cloud sync, cookie fallback, or shared Watchlist URL is introduced;
- `watchlist-ja-presentation.ts` owns no fetch/API path, localizes dynamically generated internal links only when a Japanese equivalent exists, and protects raw channel identities, storage keys, and provider URLs;
- all J6 candidates remain `noindex,follow`, self-canonical, excluded from sitemap/hreflang/public language switching until J10;
- J6c candidate contract is 46 HTML routes plus explicit 404, 47 inventory entries, 23 noindex routes, 23 sitemap routes, 19 Japanese candidates, and 184 browser scenarios across four viewports;
- freshness, coverage, provider separation, retained Top-10 semantics, bounded Watchlist evidence, raw provider identity, collector/storage/cadence/retention rules, geography semantics, and Current/IRL rules are unchanged;
- J6 is candidate-complete after PR #1326; J7 fixed informational/legal routes are next;
- J10 remains the only authorization point for Japanese indexing, sitemap, reciprocal hreflang, and public language switching.

Outcome:

Users do not fall back into English during ordinary Japanese product navigation. Fixed informational/legal routes remain a separate J7 stage.

### J7 — fixed informational/legal routes

Migrate:

- About / methodology and limits;
- Support;
- Contact surface where locally rendered;
- Terms;
- Privacy;
- Refund Policy;
- Commercial Disclosure;
- Changelog presentation.

Outcome:

Japanese users can understand operating limits, support, and legal information.

### J8 — localized SEO layer

Work:

- localized page titles/descriptions;
- canonical URLs;
- reciprocal `hreflang`;
- `x-default` where appropriate;
- OG/Twitter copy;
- localized structured-data descriptions/URLs;
- Japanese sitemap inventory prepared but not publicly indexable until J10.

Outcome:

The route tree is ready for Japanese search indexing without duplicate-language ambiguity.

### J9 — release candidate QA

Required:

- route parity inventory;
- English/Japanese literal leakage checks;
- locale route-switch tests;
- build and typecheck;
- desktop/mobile browser matrix;
- keyboard/focus/tap-target checks;
- Japanese overflow checks;
- `html[lang]` validation;
- canonical/hreflang/noindex validation;
- sitemap candidate validation;
- provider-separation/data-truth regression checks for affected pages.

Outcome:

A complete Japanese candidate exists while public English production still behaves as before.

### J10 — coordinated public release

One bounded cutover enables:

- indexable `/ja/*` routes;
- public language switcher;
- final Japanese sitemap entries;
- reciprocal hreflang;
- removal of temporary Japanese noindex.

Post-merge verify:

- exact production SHA;
- public English routes unchanged;
- public Japanese route matrix;
- language switching;
- responsive behavior;
- SEO headers/metadata;
- public sitemap.

Outcome:

English and Japanese are both first-class public ViewLoom surfaces.

## 3. Initial execution sequence

The initial foundation branch was limited to:

1. J0 specification and implementation plan;
2. J1 reusable locale/message/format/route primitives;
3. targeted type/build verification;
4. no public Japanese indexing;
5. no public language switcher;
6. no sitemap/hreflang change;
7. no production collector/D1/cadence/retention change.

Those release boundaries remain in force through J9.

## 4. Route migration order

Use shared/high-leverage surfaces first:

```text
shared shell
-> Portal
-> provider homes
-> Heatmap
-> Day Flow
-> Battle Lines
-> History
-> Stream Map
-> Data Status
-> Channel
-> Local Watchlist
-> informational/legal pages
-> SEO release layer
```

Do not create provider-language clones such as `twitch-ja` or `kick-ja` renderers.

## 5. Definition of done

Japanese localization is complete only when:

- the intended public route inventory has Japanese parity;
- shared renderers are locale-aware rather than duplicated;
- translation catalogs cover released UI copy;
- raw provider data remains raw;
- UTC aggregation semantics remain unchanged;
- all released Japanese pages have correct metadata and accessibility copy;
- public language switching maps equivalent routes safely;
- English production remains intact;
- Japanese production verification passes after the coordinated release.
