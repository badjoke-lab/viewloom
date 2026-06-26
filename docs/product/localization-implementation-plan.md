# ViewLoom localization implementation plan

Status: approved future implementation plan
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 13–14
Permanent specification: `localization-spec.md`
Entry condition: Phase 12 English release-readiness acceptance complete

## 1. Objective

Deliver a maintainable product-wide localization system, accept English/Japanese first, then Spanish/Brazilian Portuguese, while preserving routes, provider separation, data meaning, outputs, accessibility, SEO, and Cloudflare-compatible operation.

## 2. Fixed locale order

```text
Phase 13: en + ja
Phase 14: es + pt-BR
```

Arabic/RTL, automatic provider-content translation, and stream-language analytics are outside scope.

## 3. Fixed boundaries

- existing English URLs remain unchanged;
- non-English routes use locale prefixes;
- Twitch and Kick remain separate;
- no new API, D1 schema, binding, collector field, cron, or retention rule;
- provider-origin names, IDs, titles, and categories are not translated;
- CSV/JSON schemas remain stable unless separately versioned;
- no locale implementation starts before Phase 12 English source content is accepted;
- no independent copied HTML tree per language;
- no translation-management SaaS dependency without separate approval.

## 4. Branch sequence

```text
I13A work-i18n-i13a-contract
I13B work-i18n-i13b-runtime
I13C work-i18n-i13c-formatting
I13D work-i18n-i13d-shell
I13E work-i18n-i13e-heatmap
I13F work-i18n-i13f-day-flow
I13G work-i18n-i13g-battle-lines
I13H work-i18n-i13h-history
I13I work-i18n-i13i-utilities
I13J work-i18n-i13j-japanese
I13K work-i18n-i13k-acceptance
I14A work-i18n-i14a-spanish
I14B work-i18n-i14b-pt-br
I14C work-i18n-i14c-acceptance
```

Exact branch names may be changed only by the current schedule before branch creation.

## 5. I13A — localization contract and route manifest

Deliverables:

- inventory every repository-owned public route and shared UI surface after Phase 12;
- identify all user-facing strings, metadata, accessibility text, generated prose, and translation exclusions;
- define locale type, supported locale registry, route mapping, fallback, local preference, unsupported-locale behavior, and deep-link preservation;
- define canonical, `hreflang`, sitemap, Open Graph, and `x-default` behavior;
- define English-source ownership and legal-content authority;
- define pseudo-locale and long-string fixtures;
- create a temporary localization working note;
- add contract verification before runtime migration.

No public localization runtime in I13A.

## 6. I13B — locale runtime and typed catalogs

- implement locale parsing/resolution;
- implement typed message keys and English catalog;
- implement catalog loader and English fallback;
- add development and CI missing-key reporting;
- add route/state-preserving locale-link helpers;
- avoid data refetch solely for locale switching where loaded payload can be reused;
- add unit/contract gates for locale and route behavior.

## 7. I13C — formatting and pseudo-locale gates

- centralize `Intl.NumberFormat`, `Intl.DateTimeFormat`, duration, percentage, compact-number, and relative-time behavior;
- preserve explicit UTC semantics;
- implement pseudo-locale/expansion mode;
- add key-parity, duplicate-key, fallback, fixed-fixture formatting, and overflow-focused gates;
- preserve machine-readable export formats and exact values.

## 8. I13D — shared shell and provider homes

Migrate:

- Portal;
- global and provider navigation;
- mobile menu;
- footer;
- provider homes;
- shared buttons/forms/state panels;
- page metadata and not-found UI;
- locale switcher.

Requirements:

- English appearance and behavior remain accepted;
- locale switch preserves provider, route, and query state;
- no hard-coded English remains in the migrated shared shell except approved proper names/provider-origin text;
- 1440/820/390/360 pseudo-locale screenshots pass.

## 9. I13E — Heatmap

- migrate controls, summary, legend, inspector, data-state, loading/error, accessibility, and metadata copy;
- preserve canvas/camera/hit-test/LOD/split-view behavior;
- preserve provider requests and coverage wording;
- localize only ViewLoom-authored labels, not channel/provider data;
- add English/Japanese fixtures and browser gates.

## 10. I13F — Day Flow

- migrate period/date/bucket/scope controls, chart/inspector/state/legend/accessibility copy;
- preserve UTC date claims and provider-specific requests;
- keep date input accessible in every locale;
- test long labels, touch/keyboard scrubbing, loading, partial, empty, and error states.

## 11. I13G — Battle Lines

- migrate date/bucket/pair/metric controls, recommendations, chart, inspector, summary, states, legend, accessibility, and metadata copy;
- preserve selected-time/default-pair coherence accepted in Phase 10;
- preserve provider/data/request contracts;
- test English/Japanese with long names and unavailable states.

## 12. I13H — History

- migrate period/metric/task/archive controls, summary, chart, selected day, comparison, calendar, rankings, archives, report/share UI, states, accessibility, and metadata copy;
- preserve Phase 9 metric synchronization and task hierarchy;
- preserve URL, Back/Forward, no-refetch task switching, outputs, provider separation, and exact data meaning;
- localize ViewLoom-authored report/share prose only where output contracts allow;
- keep CSV/JSON keys stable.

## 13. I13I — utilities, release, and legal surfaces

Migrate:

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
- shared release/FAQ/limitations copy.

Legal requirements:

- English source authority and discrepancy wording are explicit where appropriate;
- Japanese commercial disclosure retains mandatory Japanese information;
- Stripe/refund wording matches Phase 12 acceptance;
- legal section structures are reusable and key parity is tested.

## 14. I13J — Japanese catalog and language QA

- complete reviewed Japanese catalogs;
- review terminology for metrics, coverage, data states, report/export, legal, and provider boundaries;
- test CJK font fallback, line height, punctuation, date/number formatting, and line breaking;
- review all 1440/820/390/360 routes and representative degraded states;
- run keyboard, touch, screen-reader-name, contrast, forced-color, reduced-motion, and target-size checks;
- record unresolved copy decisions in the working note.

## 15. I13K — English/Japanese candidate and acceptance

- run key parity, route generation, canonical/hreflang/sitemap, formatting, provider separation, outputs, feature, all-public browser, and screenshot gates;
- verify no unintended English fragments remain on Japanese primary tasks;
- create one deliberate Preview candidate from the accepted local head;
- verify Functions/bindings, real retained data, locale routing, deep links, metadata, and legal/support pages;
- merge only the accepted candidate;
- verify exact production deployment and English/Japanese public acceptance;
- update supported-locale claims and permanent records;
- keep the localization working note active for Phase 14.

## 16. I14A — Spanish

- complete reviewed neutral Spanish catalog;
- use one `es` locale initially rather than separate Spain/Latin America variants;
- review streaming/data terminology and legal/support translation;
- run key parity, long-string, 1440/820/390/360, accessibility, feature, provider, SEO, and output gates;
- do not publish incomplete locale routes in sitemap.

## 17. I14B — Brazilian Portuguese

- complete reviewed `pt-BR` catalog;
- do not substitute generic `pt` or `pt-PT`;
- review streaming/data terminology and legal/support translation;
- run the same parity, responsive, accessibility, feature, provider, SEO, and output gates.

## 18. I14C — four-language candidate and acceptance

- run full `en`, `ja`, `es`, and `pt-BR` route matrix;
- verify reciprocal `hreflang`, canonical, sitemap, Open Graph, unsupported-locale, and deep-link behavior;
- review representative real/partial/stale/empty/missing/demo/error states for every feature;
- verify provider-origin content remains untranslated and unmodified;
- verify locale switching does not trigger provider crossing or unnecessary refetch;
- create one deliberate Preview candidate;
- verify exact production deployment and four-language public acceptance;
- transfer stable decisions to permanent docs and delete the localization working note.

## 19. Launch handoff

After I14C, the program moves to staged publication:

```text
L14A English/Japanese publication
L14B Spanish/pt-BR publication and evidence ledger
L14C feedback classification and phase closure
```

Translation feedback is classified separately from defects, UX issues, data-capability requests, and major feature requests.

## 20. Verification matrix

Every implementation branch runs targeted checks. Final locale candidates must cover:

- catalog parity and fallback;
- route and query-state preservation;
- canonical/`hreflang`/sitemap;
- provider separation and request counts;
- date/number/unit/UTC formatting;
- feature-specific behavior;
- report/share/export contracts;
- 1440/820/390/360 responsive behavior;
- accessible names, focus, keyboard, touch, contrast, forced colors, reduced motion, wrapping, target size, and overflow;
- real and degraded data states;
- local, Preview, exact production, and permanent-document acceptance.

## 21. Stop rule

After every merge, update roadmap, schedule, program plan, this implementation plan, and the active working note; issue the full merge report; name the exact next branch; stop until explicit continuation.