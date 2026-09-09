# ViewLoom Japanese localization specification v0.1

Status: active product specification for the Japanese localization lane  
Scope: presentation, routing, metadata, accessibility copy, and localization QA  
Default public language: English  
Initial additional locale: Japanese (`ja`)  

## 1. Purpose

Add a complete Japanese version of the existing ViewLoom public web experience without replacing, fragmenting, or changing the current English product/data contracts.

Japanese localization is a parallel frontend/SEO lane. It must not serialize Stream Map, provider collection, data retention, or Current/IRL work.

## 2. Public route contract

English keeps all current canonical routes unchanged.

```text
/
/twitch/...
/kick/...
```

Japanese uses an explicit `/ja/` prefix.

```text
/ja/
/ja/twitch/...
/ja/kick/...
```

Rules:

- do not move existing English routes;
- do not use `?lang=ja` as the canonical Japanese route model;
- language switching should preserve the current provider, feature, supported search parameters, and hash where safe;
- `/ja` normalizes to `/ja/`;
- internal API routes are not localized;
- source/static asset paths are not localized.

## 3. Release model

Japanese work is built behind the current English production surface.

Before the final Japanese release gate:

- current English pages remain public and indexable;
- Japanese routes may exist only as non-public/testable candidates;
- do not expose the global language switcher on the public English site;
- Japanese pages must remain `noindex` until route parity and SEO metadata are complete;
- Japanese URLs must not be added to the public sitemap early;
- public `hreflang` must not point at incomplete Japanese routes.

The final release is one coordinated cutover of:

1. completed `/ja/*` route set;
2. visible English/Japanese language switcher;
3. removal of temporary Japanese `noindex`;
4. Japanese sitemap entries;
5. reciprocal `hreflang` and `x-default` metadata;
6. Japanese canonical/OG/structured metadata;
7. completed production browser/SEO verification.

English is not removed during this cutover.

## 4. Data semantics do not change with locale

Localization must not alter product truth or aggregation meaning.

The following remain provider/data contracts rather than translated data:

- provider identity and provider separation;
- internal enum values and API field names;
- streamer/channel names;
- raw stream titles;
- provider-returned category/tag/source strings unless a separate product contract defines a localized display label;
- stable IDs;
- coverage accounting;
- UTC-based aggregation windows and retained-day boundaries;
- Map placement/evidence semantics;
- Current/IRL qualification rules.

Changing locale must never silently change an observed UTC day into a JST aggregation day.

## 5. What is localized

Translate presentation copy, including:

- global navigation;
- page headings and explanatory copy;
- buttons and CTAs;
- filters and control labels;
- loading/empty/error/stale/partial/unavailable explanations;
- table headings where they are product copy;
- map legends and map UI copy;
- tooltips;
- accessibility labels and screen-reader copy;
- metadata: title, description, OG/Twitter text, structured-data descriptions;
- fixed support/method/legal prose.

## 6. Feature naming

Keep the established ViewLoom feature names as product labels unless a later naming decision explicitly changes them:

- Heatmap
- Day Flow
- Battle Lines
- History / History & Trends
- Stream Map
- Data Status

Japanese pages may add natural Japanese explanatory copy around these names. Do not replace them with inconsistent page-by-page coined Japanese names.

The existing feature-first display principle remains in force.

## 7. Locale and time formatting

Supported locales initially:

```text
en
ja
```

Formatting rules:

- English locale tag: `en-US` unless a page has an existing stricter contract;
- Japanese locale tag: `ja-JP`;
- observation/aggregation timestamps remain UTC unless the UI explicitly labels a separate local-time convenience display;
- a localized date/time formatter must receive an explicit timezone contract rather than infer timezone from language;
- numerical values may use locale-aware separators;
- provider/source raw values must not be mutated by formatting helpers.

## 8. Language switch behavior

A language switcher must map the user to the equivalent route where it exists.

Example:

```text
/twitch/map/?geography=city
->
/ja/twitch/map/?geography=city
```

The switcher should preserve supported query state and hash fragments. It must not preserve unsafe or page-invalid parameters merely to keep text identical.

If an equivalent localized route does not exist during development, the public switcher remains hidden rather than sending users into a partial-language experience.

## 9. SEO contract

At final Japanese release:

- each English/Japanese pair has its own canonical URL;
- each pair emits reciprocal `hreflang="en"` and `hreflang="ja"`;
- the English default/portal route may also emit `hreflang="x-default"`;
- Japanese title/description text is translated intentionally, not mechanically copied;
- Japanese routes are included in the sitemap only when indexable;
- Japanese OG/Twitter metadata matches the Japanese page copy;
- structured data uses the localized page URL and localized descriptive text while preserving factual/provider semantics.

Do not canonicalize Japanese pages back to English; that would defeat the separate-language indexable route model.

## 10. Accessibility contract

Localization must include accessibility text, not only visible labels.

Required parity includes:

- `aria-label`;
- `aria-live` status copy;
- button accessible names;
- table captions;
- map/control accessible names;
- empty/error explanations;
- mobile navigation labels.

Japanese labels must still satisfy existing target-size, keyboard, focus, overflow, and mobile contracts.

## 11. Translation ownership and glossary

English remains the source message catalog. Japanese must have one deterministic translation for every released message key.

Do not leave ad-hoc Japanese literals scattered across feature renderers. New shared product copy should enter the locale catalog first unless it is provider/raw data.

A glossary must preserve at least:

- provider names;
- feature names;
- data-state terminology;
- observation/coverage terminology;
- Stream Map geography terms;
- Current/IRL vs Home/Base distinction.

## 12. Hard boundaries

Japanese localization does not authorize:

- production collector changes;
- collector cadence changes;
- D1 schema/binding/write changes;
- retention/backfill changes;
- provider aggregation;
- cross-provider identity mapping;
- geography inference changes;
- Current/IRL activation;
- changes to reviewed evidence;
- changes to raw provider data.

## 13. Release acceptance

The Japanese version is not publicly complete until all intended public English routes have an accepted Japanese counterpart or are explicitly documented as intentionally English-only.

Required final checks:

- route parity inventory;
- no unexpected English UI literals in Japanese pages;
- no unexpected Japanese UI literals in English pages;
- language switch route/state preservation;
- 404/link integrity;
- desktop and mobile rendering;
- no horizontal overflow introduced by translated copy;
- keyboard/focus/accessibility parity;
- `lang` attribute correctness;
- canonical/hreflang correctness;
- sitemap correctness;
- noindex removal only at the final gate;
- production deployment SHA and public smoke verification.
