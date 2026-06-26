# ViewLoom localization implementation plan

Status: approved future implementation plan
Version: 1.0
Created: 2026-06-26
Roadmap phases: Phase 13–14
Permanent specification: `localization-spec.md`
Entry condition: Phase 12 English release-readiness acceptance complete

## 1. Objective

Deliver a maintainable product-wide localization system, accept English/Japanese first, then Spanish/Brazilian Portuguese, while preserving routes, provider separation, data meaning, outputs, accessibility, SEO, and Cloudflare-compatible operation.

## 2. Locale order

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
- localization begins only after Phase 12 English source content is accepted;
- no copied per-language HTML tree;
- no translation-management SaaS without separate approval.

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

Exact names may change only through the current schedule before creation.

## 5. I13A — contract and route manifest

- inventory every owned public route and shared surface after Phase 12;
- identify user-facing strings, metadata, accessibility text, generated prose, and translation exclusions;
- define locale type, registry, route mapping, fallback, local preference, unsupported-locale behavior, and deep-link preservation;
- define canonical, `hreflang`, sitemap, Open Graph, and `x-default` behavior;
- define English-source and legal-content ownership;
- define pseudo-locale and long-string fixtures;
- create a temporary localization working note;
- add contract verification before runtime migration.

No public localization runtime in I13A.

## 6. I13B — locale runtime and typed catalogs

Implement locale parsing/resolution, typed message keys, English catalog, catalog loader, English fallback, missing-key reporting, and route/state-preserving locale links. Locale changes must not refetch provider data when loaded payloads can be reused.

## 7. I13C — formatting and pseudo-locale

Centralize number/date/duration/percentage/relative-time formatting with `Intl`, preserve explicit UTC semantics, add pseudo-locale expansion, key-parity/duplicate/fallback gates, and keep machine-readable exports exact.

## 8. I13D — shared shell

Migrate Portal, global/provider navigation, mobile menu, footer, provider homes, shared controls/state panels, metadata, not-found UI, and locale switcher. Preserve English behavior and provider/query state. Require 1440/820/390/360 pseudo-locale screenshots.

## 9. I13E — Heatmap

Migrate controls, summary, legend, inspector, data states, loading/error, accessibility, and metadata copy. Preserve canvas/camera/hit-test/LOD/split-view behavior, provider requests, and coverage wording. Do not translate channel/provider data.

## 10. I13F — Day Flow

Migrate date/bucket/scope controls, chart/inspector/state/legend/accessibility copy. Preserve UTC dates and provider requests. Keep the date control accessible. Test long labels, touch/keyboard scrubbing, loading, partial, empty, and error states.

## 11. I13G — Battle Lines

Migrate date/bucket/pair/metric controls, recommendations, chart, inspector, summary, states, legend, accessibility, and metadata copy. Preserve Phase 10 selected-time/default-pair coherence and all provider/request contracts.

## 12. I13H — History

Migrate period/metric/task/archive controls, Summary, chart, Selected day, comparison, calendar, rankings, Archives, Report/Share UI, states, accessibility, and metadata copy. Preserve Phase 9 metric synchronization, task hierarchy, URL/Back/Forward, no-refetch switching, outputs, provider separation, and exact data meaning. Keep CSV/JSON keys stable.

## 13. I13I — utility, release, and legal surfaces

Migrate Channel, Local Watchlist, Data Status, About, Support, Changelog where appropriate, Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, and release/FAQ/limitations copy.

English source authority and discrepancy wording must be explicit where legally appropriate. Japanese Commercial Disclosure retains required Japanese information. Stripe/refund wording must match Phase 12 acceptance.

## 14. I13J — Japanese QA

Complete reviewed Japanese catalogs. Review terminology for metrics, coverage, data states, report/export, legal, and provider boundaries. Test CJK fonts, line height, punctuation, date/number formatting, line breaks, all required widths, representative degraded states, keyboard, touch, screen-reader names, contrast, forced colors, reduced motion, and target sizes.

## 15. I13K — English/Japanese acceptance

Run key parity, route generation, canonical/`hreflang`/sitemap, formatting, provider separation, outputs, feature, all-public browser, and screenshot gates. Verify no unintended English fragments remain on Japanese primary tasks. Use one deliberate Preview candidate, verify Functions/bindings and real data, merge only the accepted candidate, verify exact production deployment, update supported-locale claims, and retain the working note for Phase 14.

## 16. I14A — Spanish

Complete a reviewed neutral Spanish catalog. Use one `es` locale initially. Review streaming/data terminology and legal/support translation. Run parity, long-string, required-width, accessibility, feature, provider, SEO, and output gates. Do not publish incomplete routes in the sitemap.

## 17. I14B — Brazilian Portuguese

Complete a reviewed `pt-BR` catalog. Do not substitute generic `pt` or `pt-PT`. Run the same terminology, legal/support, parity, responsive, accessibility, feature, provider, SEO, and output gates.

## 18. I14C — four-language acceptance

Run the full `en`, `ja`, `es`, and `pt-BR` route matrix. Verify reciprocal `hreflang`, canonical, sitemap, Open Graph, unsupported-locale, deep-link behavior, representative real/degraded states, unmodified provider-origin data, no provider crossing, and no unnecessary locale-switch refetch. Use one deliberate Preview candidate, verify exact production deployment, transfer stable decisions, and delete the localization working note.

## 19. Launch handoff

After I14C:

```text
L14A English/Japanese publication
L14B Spanish/pt-BR publication and evidence ledger
L14C feedback classification and phase closure
```

Translation feedback is classified separately from defects, UX issues, data-capability requests, and major feature requests.

## 20. Verification matrix

Final candidates cover catalog parity/fallback, routes/query state, canonical/`hreflang`/sitemap, provider separation/request counts, date/number/unit/UTC formatting, feature behavior, report/share/export contracts, required widths, accessibility, real/degraded states, local acceptance, deliberate Preview, exact production, and permanent documentation.

## 21. Stop rule

After every merge, update roadmap, schedule, program plan, this plan, and the active working note; issue the full merge report; name the exact next branch; stop until explicit continuation.