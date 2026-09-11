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

Current candidate state (2026-09-11):

- `/ja/twitch/map/` and `/ja/kick/map/` are implemented on `work-japanese-localization-stream-map-candidates-20260911`;
- both are `noindex,follow`, self-canonical, excluded from sitemap/hreflang/public language switching;
- Twitch reuses `maplibre-bootstrap.ts`, `geography-ui-bootstrap.ts`, `stream-map-entry.ts`, and the existing `/api/twitch-stream-map` Country/City contract;
- Kick reuses `public-entry.ts` / `public-kc5-entry.ts` and existing `/api/kick-stream-map` Country/City contracts;
- one locale-gated `stream-map-ja-presentation.ts` adapter translates presentation copy after the existing runtimes render and owns no API path or network request;
- streamer names, country/city names, runtime category names, reason codes, stable IDs, and other raw/provider data remain untranslated;
- Country, Base City, City, and Current / IRL semantics are unchanged; Current / IRL remains unavailable where the existing product contract keeps it unavailable;
- no creator coordinates, inferred location, collector, D1, cadence, retention, or geography acceptance rule is introduced;
- the current candidate inventory target is 40 HTML routes plus explicit 404, 41 inventory entries, 17 noindex routes, 23 sitemap routes, 13 Japanese candidates, and 160 browser scenarios across four viewports;
- public exposure/indexing still remains forbidden until J10.

Outcome:

Japanese localization covers the current main product program without forking Map logic.

### J6 — utility/deep routes

Migrate:

- Channel;
- Local Watchlist;
- Data Status;
- other public utility routes present in the current route inventory.

Outcome:

Users do not fall back into English during ordinary Japanese navigation.

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
-> Channel / Watchlist / Status
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
