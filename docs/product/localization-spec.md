# ViewLoom localization specification

Status: approved future permanent product specification
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 13–14
Implementation plan: `localization-implementation-plan.md`
Entry condition: Phase 12 English release-readiness acceptance complete

## 1. Purpose

This specification defines how ViewLoom localizes its public UI while preserving provider separation, source-data honesty, stable URLs, accessibility, SEO, and maintainability.

Localization is a product-wide presentation capability. It is not stream-language collection or analytics.

## 2. Initial locale set

```text
en     English source language
ja     Japanese
es     Spanish
pt-BR  Brazilian Portuguese
```

Delivery order:

```text
Phase 13: en + ja
Phase 14: es + pt-BR
```

Arabic/RTL is not included. It requires a separately approved RTL specification after usage evidence justifies the work.

## 3. URL contract

Existing English URLs remain unchanged and canonical:

```text
/twitch/heatmap/
/kick/history/
/about/
```

Non-English routes use a locale prefix:

```text
/ja/twitch/heatmap/
/es/kick/history/
/pt-br/about/
```

Requirements:

- old English links remain valid without redirect churn;
- each localized page has a self-referencing canonical appropriate to the locale route;
- every translated equivalent publishes reciprocal `hreflang` entries;
- `x-default` points to the existing English route unless a later specification changes it;
- Back/Forward and direct links preserve locale, provider, feature state, and supported query parameters;
- provider routes never change provider when locale changes;
- locale switching does not remove valid date, period, metric, task, archive, channel, sort, or limit state.

## 4. Locale selection and fallback

- explicit URL locale wins;
- a user-selected locale may be stored locally for navigation convenience;
- browser language may be used only for a clearly controlled first-visit suggestion or root routing rule approved by implementation tests;
- no silent redirect may make a shared deep link open in a different locale than its URL;
- missing translation keys fall back to English and are reported by development/CI gates;
- unsupported locale prefixes return the owned not-found behavior rather than silently serving misleading content.

## 5. Translation boundary

Translate:

- navigation, headings, labels, buttons, tabs, filters, forms, tooltips, legends, state messages, accessibility text, methodology, support, legal, SEO metadata, report UI, and generated ViewLoom-authored explanatory copy;
- metric labels and units where the meaning remains exact;
- date/number/percentage/relative-time presentation through locale-aware formatters;
- route-level title, description, Open Graph, and structured metadata where supported.

Do not translate or synthesize:

- streamer display names;
- channel IDs, slugs, and provider identifiers;
- stream titles;
- provider category/game names unless the provider response already supplies a localized label under an approved contract;
- raw provider-origin error/detail text that must remain exact, unless a separate ViewLoom explanation is added without replacing the source;
- API field names, export schema keys, filenames required by existing contracts, or machine-readable identifiers.

Automatic translation of provider-origin content is not allowed in the initial localization program.

## 6. Provider and data invariants

Every locale must preserve:

- separate Twitch and Kick routes, APIs, D1 bindings, rankings, exports, and coverage claims;
- no combined provider totals or cross-provider identity;
- no locale-dependent change to data requests or retained-data meaning;
- bounded observation language;
- explicit real, partial, stale, in-progress, missing, demo, empty, and error states;
- provider-specific links, filenames, labels, and accents;
- exact output schemas unless separately versioned.

## 7. Message architecture

The implementation must use one central locale system rather than copied HTML pages.

Required concepts:

```text
locale registry
typed message keys
English source catalog
per-locale catalogs
fallback resolution
missing-key reporting
locale-aware formatting
route/SEO manifest
pseudo-locale or expansion test mode
```

Accepted direction:

```text
apps/web/src/i18n/
  locale.ts
  messages.ts
  format.ts
  routing.ts
  locales/
    en.ts
    ja.ts
    es.ts
    pt-BR.ts
```

Exact file names may change in the implementation plan, but the architectural roles must remain explicit.

Hard-coded user-facing English inside feature renderers must be migrated to typed message keys. Dynamic provider data remains separate from messages.

## 8. Formatting contract

Use standard locale-aware formatting primitives such as:

- `Intl.NumberFormat`;
- `Intl.DateTimeFormat`;
- `Intl.RelativeTimeFormat` where needed;
- explicit UTC handling for ViewLoom date/time claims;
- locale-aware plural/select logic where required.

Requirements:

- data meaning never changes with locale;
- UTC remains visibly stated where the feature contract requires it;
- compact numbers retain exact values in accessible/detail text where already required;
- percentages, dates, durations, and counts use consistent locale-aware rules;
- exported machine-readable data does not silently switch numeric syntax or schema.

## 9. Layout and accessibility contract

Required widths for every locale:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- long Japanese, Spanish, and Portuguese copy wraps safely;
- CJK fonts and line height remain readable;
- controls do not rely on English word length;
- pseudo-long strings are tested before real translations are complete;
- accessible names, live-region messages, chart descriptions, image alternatives, and form errors are localized;
- focus order, visible focus, keyboard, touch, reduced motion, contrast, and forced colors remain equivalent across locales;
- target sizes stay at least as large as the accepted English interface;
- locale switcher has a stable accessible name and identifies the current locale.

RTL behavior is not implemented or claimed.

## 10. Feature coverage

Localization is incomplete until the accepted public surface set is covered:

- Portal;
- Twitch and Kick provider homes;
- Heatmap;
- Day Flow;
- Battle Lines;
- History;
- Channel;
- Local Watchlist;
- Data Status;
- About;
- Support;
- Changelog where appropriate;
- Contact;
- Terms;
- Privacy;
- Refund Policy;
- Commercial Disclosure;
- owned not-found behavior;
- shared navigation, footer, state panels, metadata, and accessibility copy.

A page may not be advertised as localized when its primary task still contains unexplained English UI fragments, except provider-origin content covered by the translation boundary.

## 11. Legal and support content

English legal/support content is the source text completed in Phase 12.

- translations must identify whether English controls in case of discrepancy when legally appropriate;
- commercial disclosure must preserve mandatory Japanese information in the Japanese version;
- refund/payment wording must stay consistent with the accepted Stripe flow;
- legal translation review and update ownership must be documented;
- legal pages use structured reusable sections rather than independent pasted HTML copies.

## 12. SEO and discovery

- localized titles and descriptions;
- reciprocal `hreflang` for all published equivalents;
- locale-aware sitemap entries;
- correct canonical URLs;
- Open Graph locale metadata where supported;
- no duplicate indexable placeholder locale pages;
- no locale route enters sitemap before its content and browser acceptance are complete;
- machine-readable public layer remains truthful about supported locales.

## 13. Report, share, and export behavior

- ViewLoom-authored visible report/share copy follows the selected UI locale where the existing output contract permits localized prose;
- CSV/JSON schemas and keys remain stable unless a separately versioned output contract approves change;
- provider, period, metric, scope, source, state, and limitation language remain explicit;
- filenames preserve existing provider/date safety contracts;
- copied deep links preserve locale;
- no locale change triggers an unnecessary data refetch when the loaded payload can be reused safely.

## 14. Quality gates

Permanent gates must verify:

- catalog key parity and no unintended missing keys;
- no duplicate message-key definitions;
- locale route generation and direct-link restoration;
- canonical and reciprocal `hreflang` correctness;
- locale preservation across provider/feature/state navigation;
- no provider crossing;
- formatting with fixed UTC and known numeric fixtures;
- pseudo-locale expansion and overflow;
- accessible names and visible primary tasks;
- full public-route matrix at required widths;
- English/Japanese acceptance before Phase 14;
- four-language acceptance before external publication.

## 15. Non-goals

The initial localization program does not add:

- automatic translation of stream titles or categories;
- stream-language collection or trends;
- country-specific provider rankings;
- geo-personalization;
- login or cloud-synced language preference;
- RTL/Arabic;
- a translation-management SaaS dependency unless separately approved;
- AI-generated translations published without review;
- API, D1, collector, cron, retention, or binding changes.

## 16. Acceptance

A locale phase is accepted only when:

- every scheduled route and shared surface is translated under the defined boundary;
- fallback and missing-key behavior is tested;
- provider/data/output invariants pass;
- required widths and accessibility gates pass;
- SEO/canonical/hreflang/sitemap gates pass;
- localized legal/support text is reviewed under the documented ownership rule;
- local, deliberate Preview, and exact production acceptance pass;
- the supported-locale public claim matches the actually accepted locale set;
- permanent documentation and maintenance ownership are updated.