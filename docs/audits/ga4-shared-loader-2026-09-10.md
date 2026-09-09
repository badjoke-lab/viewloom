# ViewLoom GA4 shared loader audit — 2026-09-10

Status: implementation candidate

## Finding

ViewLoom already had GA4 measurement ID `G-YHX7HS1VBK` bootstrapped directly on the Portal (`apps/web/index.html`). Public feature/content pages also import the shared module `src/analytics.ts`, but before this change that module only forwarded custom events to `window.gtag` when another script had already created it.

That meant the shared analytics entry did not itself guarantee a GA4 page-view/runtime on non-Portal routes. A page could load `analytics.ts` successfully while `trackEvent()` remained a no-op because `window.gtag` was undefined.

This is separate from the GSC Wizard account mapping issue: the readable GA4 property named `viewloom` (property ID `539584078`) still has no `linkedSiteUrls` entry for `sc-domain:viewloom.net` inside GSC Wizard. Repository instrumentation cannot create that account-side linkage.

## Change

`src/analytics.ts` now owns the missing shared bootstrap:

- reuses measurement ID `G-YHX7HS1VBK`;
- initializes `dataLayer` and `gtag` where absent;
- injects the official async `gtag.js` script where absent;
- sends the GA4 `config` call once per page;
- detects the Portal's existing historical inline bootstrap and does not send a second config call there;
- keeps the existing `trackEvent()` API unchanged.

## SEO/analytics QA boundary

`verify-seo-qa.mjs` now includes both public Stream Map routes in addition to the existing SEO surfaces, for 23 public pages total. Every page in that contract must include `/src/analytics.ts`, and the shared analytics module must retain the measurement ID, gtag loader, dataLayer, config call, and bootstrap invocation.

## Explicit non-changes

- no GSC property mutation;
- no GA4 property/account mutation;
- no collector or API changes;
- no D1/schema/binding changes;
- no cadence, retention, or backfill changes;
- no consent-mode or advertising features added;
- no cross-platform combined metrics added.

## After production

Production acceptance should verify that representative non-Portal pages load `gtag.js` with `G-YHX7HS1VBK` and that the GSC Wizard GA4 property linkage remains a separate configuration task. Once `viewloom` property `539584078` is linked to `sc-domain:viewloom.net` inside GSC Wizard, GA4 overview, landing-page, channel/source, and AI-assistant referral reports can be queried from the plugin.
