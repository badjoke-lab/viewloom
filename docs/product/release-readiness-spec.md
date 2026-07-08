# ViewLoom Phase 12 English release readiness specification

Status: active permanent product specification
Version: 1.0
Created: 2026-07-08
Roadmap phase: Phase 12
Implementation plan: `release-readiness-plan.md`
Entry condition: Phase 11 production closeout complete
Localization handoff: `localization-spec.md`

## 1. Purpose

Phase 12 makes the existing English ViewLoom public surface ready for support, legal disclosure, Stripe support-flow use, and external launch communication before localization begins.

Phase 12 is not an analytics feature phase and not a localization runtime phase. English remains the source language for Phase 13–14 localization.

## 2. Phase sequence

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

R12A must complete before R12B. R12B must complete before R12C final acceptance.

## 3. Permanent boundaries

Phase 12 preserves:

- separate Twitch and Kick routes, APIs, bindings, storage, rankings, reports, exports, and coverage claims;
- the existing collector cadence and observed-window policies;
- current raw and rollup retention unless separately approved;
- explicit real, partial, stale, in-progress, missing, demo, empty, and error states;
- the accepted 1440px, 820px, 390px, and 360px responsive contract;
- English canonical URLs as the source-language routes for later localization.

Phase 12 does not authorize:

- analytics APIs, baseline storage, anomaly detection, relationship analysis, or replay work;
- localization routing or locale catalogs;
- new application or collector cron schedules;
- provider-combined totals, rankings, identities, baselines, or relationships;
- user accounts, subscriptions, cloud watchlist sync, alerts, or payment backends;
- Stripe secret keys or privileged Stripe API operations in the browser;
- unverified claims about Stripe dashboard or account state.

## 4. R12A — legal and support public-surface completion

### 4.1 Required routes

R12A adds the five missing repository-owned routes identified by the public-surface audit:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

These pages join the existing About and Support surfaces as the English legal/support source set.

### 4.2 Content responsibilities

#### Contact

Must provide:

- the supported contact channel;
- the expected purpose of contact;
- enough identity/context to distinguish ViewLoom support from Twitch or Kick support;
- no unsupported response-time guarantee.

#### Terms

Must describe at minimum:

- ViewLoom's independent and unofficial status;
- the observational nature of the service;
- bounded coverage and retained-data limitations;
- acceptable use and availability boundary;
- external platform and third-party link boundary;
- liability/disclaimer wording appropriate to the actual service.

#### Privacy

Must describe only actual data behavior and integrations, including where applicable:

- site analytics or measurement scripts actually present;
- browser-local Watchlist storage;
- provider/public API data handling at a truthful high level;
- contact communications;
- external Payment Link transition;
- no invented account/profile data collection.

#### Refund Policy

Must match the actual support/payment model and Payment Link configuration. It must not promise a refund process the operator cannot perform and must provide a clear contact path for refund questions or mistakes.

#### Commercial Disclosure

Must provide the required operator and transaction disclosures for the actual support/payment flow. Required Japanese disclosure content may be present on the English source route when necessary; Phase 13–14 translations must preserve accepted legal ownership and Stripe/refund wording.

### 4.3 About and footer audit

R12A must also verify and repair where needed:

- About purpose and independent/unofficial wording;
- bounded observed-data explanation;
- provider separation explanation;
- links to Status surfaces;
- support/legal route discoverability;
- footer link completeness and consistent order;
- keyboard access, visible focus, wrapping, and target sizes;
- provider-neutral pages issuing no provider requests unless their task explicitly requires one.

### 4.4 Route ownership and discovery

The five routes must be registered in all relevant ownership systems:

- Vite/public build inputs;
- repository public-surface inventory;
- Public Readiness ownership;
- Production Smoke ownership;
- sitemap/indexability policy where approved;
- canonical and metadata checks;
- public browser acceptance.

Route-count changes must be derived from the actual post-implementation route inventory rather than hard-coded from this specification.

## 5. R12B — Stripe and support-flow readiness

R12B verifies the actual support/payment path from ViewLoom to the approved Stripe Payment Link or equivalent separately approved Stripe surface.

Required checks:

```text
Support entry wording
Payment Link destination
operator-facing Stripe registration evidence
refund wording consistency
Commercial Disclosure consistency
mobile flow
desktop flow
external-link semantics
Back/return behavior where controllable
no client secret exposure
no unsupported recurring/subscription claim
```

Repository content alone must not claim that an external Stripe account setting is complete. External dashboard state must be supported by recorded operator evidence or other authoritative evidence before completion is claimed.

The product should use support-oriented wording that matches the approved commercial model. It must not silently label the same flow as a charitable donation unless that legal/payment characterization is separately established.

## 6. R12C — English launch package and release acceptance

R12C owns the English public explanation package needed for external listing and launch.

Required content includes:

```text
short product description
longer product description
core feature summary
bounded-data and coverage limitations
Twitch/Kick separation explanation
Status and methodology/help links
Support and legal links
FAQ
launch/share images or reusable screenshots where required
```

Launch copy must not claim:

- provider-wide exhaustive coverage;
- merged Twitch/Kick rankings or totals;
- exact sessions when only observed evidence exists;
- causal explanations for viewer movement;
- unsupported real-time guarantees;
- unsupported official affiliation with Twitch or Kick.

## 7. English source-language contract

Phase 12 English copy becomes the source for Phase 13–14 localization.

Requirements:

- stable headings and section ownership;
- reusable structured legal/support sections where practical;
- no unnecessary duplication of the same legal wording across independent HTML copies;
- terminology aligned with current product roles: Heatmap, Day Flow, Battle Lines, History, Channel, Local Watchlist, Status;
- dates, data coverage, and provider limitations written so translation does not change meaning.

## 8. Responsive and accessibility contract

Every new or materially changed Phase 12 route must be accepted at:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- legal text and long links wrap safely;
- headings follow a coherent hierarchy;
- keyboard first entry reaches visible navigation/actionable content;
- visible focus remains present;
- touch targets follow the accepted site rules;
- forms and external links have accessible names;
- color is not the only carrier of required meaning;
- provider-neutral legal pages remain understandable without analytics JavaScript.

## 9. SEO and metadata

Each indexable Phase 12 page must have deliberate:

- title;
- description;
- canonical URL;
- robots policy;
- sitemap ownership;
- Open Graph metadata where the shared system supports it.

No placeholder legal or support page may enter the sitemap.

## 10. Acceptance

Phase 12 is complete only when:

1. R12A five missing routes and About/footer audit are accepted;
2. route ownership, readiness, browser, metadata, and Production Smoke coverage are updated from actual inventory;
3. R12B support/Stripe/refund/disclosure evidence is recorded and consistent;
4. R12C English launch package, FAQ, limitations, and status/help links are complete;
5. required latest-head CI and browser gates pass;
6. deliberate hosted verification passes for public behavior that changed;
7. exact production deployment and smoke evidence pass;
8. English source content is ready for Phase 13 localization;
9. temporary Phase 12 working notes are closed according to documentation governance.

After Phase 12 completion, Phase 12A Analytics Capture Foundation is the next approved program before Phase 13 localization.
