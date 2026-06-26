# ViewLoom localization specification

Status: approved future permanent product specification
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 13–14
Implementation plan: `localization-implementation-plan.md`
Entry condition: Phase 12 English release-readiness acceptance complete

## 1. Purpose

This specification defines how ViewLoom localizes its public UI while preserving provider separation, data honesty, stable URLs, accessibility, SEO, and maintainability.

Localization is a presentation capability. It is not stream-language collection or analytics.

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

Arabic/RTL is not included. It requires a separately approved RTL phase after usage evidence.

## 3. URL contract

Existing English URLs remain unchanged and canonical:

```text
/twitch/heatmap/
/kick/history/
/about/
```

Non-English routes use locale prefixes:

```text
/ja/twitch/heatmap/
/es/kick/history/
/pt-br/about/
```

Requirements:

- old English links remain valid;
- each localized page has a correct self-referencing canonical;
- translated equivalents publish reciprocal `hreflang` entries;
- `x-default` points to the existing English route unless later approved otherwise;
- Back/Forward and direct links preserve locale, provider, route, and supported query state;
- locale switching never changes provider;
- valid date, period, metric, task, archive, channel, sort, and limit state is retained.

## 4. Locale selection and fallback

- explicit URL locale wins;
- a user-selected locale may be stored locally for navigation convenience;
- browser language may only drive a controlled first-visit suggestion or approved root-routing rule;
- shared deep links may not silently open in another locale;
- missing keys fall back to English and are reported by development/CI gates;
- unsupported locale prefixes return owned not-found behavior.

## 5. Translation boundary

Translate ViewLoom-authored navigation, headings, labels, buttons, tabs, filters, forms, tooltips, legends, state messages, accessibility text, methodology, support/legal copy, SEO metadata, report UI, and explanatory prose. Use locale-aware formatting for dates, numbers, percentages, durations, and relative time.

Do not translate or synthesize:

- streamer display names;
- channel IDs, slugs, and provider identifiers;
- stream titles;
- provider category/game names unless the provider already supplies an approved localized value;
- raw provider-origin detail that must remain exact;
- API field names, export schema keys, contract filenames, and machine identifiers.

Automatic translation of provider-origin content is not allowed in the initial program.

## 6. Provider and data invariants

Every locale preserves separate Twitch and Kick routes, APIs, D1 bindings, rankings, exports, and coverage claims. Locale never changes data requests or retained-data meaning. Real, partial, stale, in-progress, missing, demo, empty, and error states remain explicit. Existing output schemas remain stable unless separately versioned.

## 7. Message architecture

Use one central locale system rather than copied HTML trees.

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
pseudo-locale or expansion mode
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

Exact file names may change, but these roles remain explicit. Hard-coded ViewLoom UI English must migrate to typed keys. Dynamic provider data remains separate.

## 8. Formatting contract

Use `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat` where needed, explicit UTC handling, and locale-aware plural/select logic.

Data meaning never changes with locale. UTC remains visible where required. Compact values retain exact accessible/detail values where required. Machine-readable exports do not silently change numeric syntax or schema.

## 9. Layout and accessibility

Every locale is accepted at:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- Japanese, Spanish, and Portuguese text wraps safely;
- CJK font fallback and line height remain readable;
- controls do not rely on English word length;
- pseudo-long strings are tested before translation completion;
- accessible names, live-region messages, chart descriptions, image alternatives, and form errors are localized;
- focus order, visible focus, keyboard, touch, reduced motion, contrast, and forced colors remain equivalent;
- target sizes stay at least as large as the accepted English interface;
- the locale switcher identifies the current locale and has an accessible name.

RTL behavior is not implemented or claimed.

## 10. Feature coverage

Localization is incomplete until the accepted public surface set is covered:

- Portal and provider homes;
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

A page is not advertised as localized when its primary task still contains unexplained English UI fragments, except provider-origin content under the translation boundary.

## 11. Legal and support content

English legal/support content is the source completed in Phase 12. Translations must preserve accepted Stripe/refund wording and legal ownership rules. Japanese Commercial Disclosure retains required Japanese information. Legal pages use reusable structured sections rather than pasted independent HTML copies.

## 12. SEO and discovery

- localized titles/descriptions;
- reciprocal `hreflang`;
- locale-aware sitemap entries;
- correct canonical URLs;
- Open Graph locale metadata where supported;
- no indexable placeholder locale pages;
- no locale enters the sitemap before content and browser acceptance are complete;
- machine-readable public metadata remains truthful about supported locales.

## 13. Report, share, and export

ViewLoom-authored visible report/share copy follows the UI locale where existing contracts permit localized prose. CSV/JSON schemas and keys remain stable. Provider, period, metric, scope, source, state, and limitation language remains explicit. Filenames preserve provider/date safety. Deep links preserve locale. Locale switching does not refetch when loaded data can be safely reused.

## 14. Quality gates

Permanent gates verify catalog parity, no unintended missing keys, no duplicate keys, route generation, direct-link restoration, canonical/`hreflang`/sitemap correctness, locale/state preservation, provider separation, fixed UTC/number fixtures, pseudo-locale expansion, overflow, accessible names, all public routes at required widths, English/Japanese acceptance before Phase 14, and four-language acceptance before launch.

## 15. Non-goals

The initial program does not add automatic stream-title/category translation, stream-language analytics, country rankings, geo-personalization, login/cloud-synced language preference, RTL/Arabic, translation-management SaaS without approval, unreviewed AI-published translations, or API/D1/collector/cron/retention/binding changes.

## 16. Acceptance

A locale phase is accepted only when every scheduled route and shared surface follows the translation boundary; fallback/missing-key behavior is tested; provider/data/output invariants pass; required widths and accessibility pass; SEO/canonical/`hreflang`/sitemap gates pass; legal/support translations follow documented ownership; local, deliberate Preview, and exact production acceptance pass; supported-locale claims match reality; and permanent maintenance ownership is updated.