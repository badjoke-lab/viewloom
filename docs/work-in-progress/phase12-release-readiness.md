# Phase 12 English release readiness working record

Status: active
Phase: Phase 12
Specification: `../product/release-readiness-spec.md`
Implementation plan: `../product/release-readiness-plan.md`
Entry evidence: `../operations/phase11-production-closeout-2026-07-08.md`
Baseline audit: `../audits/phase12-r12a-legal-support-baseline.json`
Current workstream: R12A-1 shared legal/support page foundation
Active branch: `work-release-r12a-legal-support`
Branch created: yes

## Purpose

This note owns unstable Phase 12 execution memory. Permanent product behavior belongs in the specification and implementation plan.

## Workstreams

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

## Entry facts

```text
Phase 11 hosted closeout: pass
Target/deployed main SHA: 90fb2714137cc83e6f20e44415574a5e35a98439
Hosted workflow run: 28932232525
Hosted artifact: 8163904094
Blocking monitoring alerts: 0
Twitch capacity watch: at-or-over-window 300/300
Kick capacity watch: at-or-over-window 100/100
Phase 12 entry main SHA: fe11bcbfa893ce2190bd6cd9df8a12b8639f1167
```

The capacity watch observations are carried to Phase 12A analytics capacity baseline work. Phase 12 itself does not change observed-set limits.

## R12A-0 baseline audit — complete

Permanent machine-readable evidence: `docs/audits/phase12-r12a-legal-support-baseline.json`.

Historical P8B evidence recorded five missing policy/disclosure routes:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

Entry inventory before R12A implementation:

```text
Vite HTML inputs: 20
Explicit not-found pages: 1
Inventory entries: 21
Public Readiness configured pages: 20
Production Smoke page routes: 20
Historical missing-surface probes: 5
```

### Owner map

```text
Build inputs              apps/web/vite.config.ts
About                     apps/web/about/index.html
Support                   apps/web/support/index.html
Shared shell/footer       apps/web/src/shared-shell.ts
Current static entry      apps/web/src/mock-site.ts
Portal route manifest     docs/audits/public-surface-routes-portal.json
Profile inventory         docs/audits/public-surface-profiles-core.json
Gap inventory             docs/audits/public-surface-gaps.json
Public Readiness          apps/web/scripts/public-readiness-audit.mjs
Public Browser            apps/web/scripts/public-browser-audit.mjs
Production Smoke          .github/workflows/production-smoke.yml
Sitemap                   apps/web/public/sitemap.xml
Content QA                apps/web/scripts/verify-content-qa.mjs
SEO QA                    apps/web/scripts/verify-seo-qa.mjs
```

### Audit findings

1. About and Support currently use `mock-site.ts`.
2. `mock-site.ts` fetches both provider status APIs on provider-neutral portal pages, while the route inventory records `apis: []` for About and Support.
3. R12A will add a provider-neutral static page entry with no provider API requests and migrate About/Support to it.
4. GA4 measurement `G-YHX7HS1VBK` is injected into every built HTML page by Vite, so Privacy must describe this actual behavior.
5. Contact is currently an external Google Form footer link. `/contact/` will become the primary owned surface; the Google Form may remain the submission channel.
6. Support already contains the Stripe Payment Link `https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03` and labels payment as one-time. External Stripe account/dashboard facts remain R12B evidence items.
7. Public Readiness derives pages from route manifests, but Production Smoke hard-codes route paths.
8. Public Browser derives routes from the route manifest but currently targets production for the route matrix even on PRs. R12A must test candidate routes locally on PRs and leave exact post-merge production verification to Production Smoke.
9. Current gap probes are derived from `public-surface-gaps.json`; historical P8B evidence must be preserved separately before the five current gaps are resolved.
10. Sitemap is static XML and requires explicit update.

### R12A decisions

```text
New route profile: static_legal
Five new routes: indexable and included in sitemap
Provider-neutral static pages: no provider status API requests
About/Support: migrate to provider-neutral static entry
Footer Contact: internal /contact/ route
Google Form: may remain contact submission channel
PR browser route matrix: local candidate
Exact production acceptance: Production Smoke
Historical P8B missing evidence: preserved separately
Current gap state after production acceptance: resolved
```

## R12A implementation state

```text
R12A-0 current legal/support surface audit: complete
R12A-1 shared legal/support page foundation: active
R12A-2 Contact, Terms, Privacy: queued
R12A-3 Refund Policy and Commercial Disclosure: queued
R12A-4 About/footer and route ownership integration: queued
R12A-5 candidate and hosted acceptance: queued
```

## Open evidence items

```text
R12A content draft verification: pending
R12A current route count after implementation: pending measurement
R12A browser matrix after implementation: pending
R12A hosted production evidence: pending
R12B actual Payment Link destination: repository URL known; hosted configuration audit pending
R12B Stripe registered website evidence: pending external operator evidence audit
R12B refund configuration evidence: pending external operator evidence audit
R12C launch asset inventory: pending
```

Do not convert external Stripe state from memory into a completion claim. Record the evidence source and date when R12B begins.
