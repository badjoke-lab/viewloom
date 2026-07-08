# Phase 12 English release readiness working record

Status: active
Phase: Phase 12
Specification: `../product/release-readiness-spec.md`
Implementation plan: `../product/release-readiness-plan.md`
Entry evidence: `../operations/phase11-production-closeout-2026-07-08.md`
Baseline audit: `../audits/phase12-r12a-legal-support-baseline.json`
Current workstream: R12A-5 candidate and hosted acceptance
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
Provider-neutral entry    apps/web/src/static-page.ts
Portal route manifest     docs/audits/public-surface-routes-portal.json
Profile inventory         docs/audits/public-surface-profiles-core.json
Gap inventory             docs/audits/public-surface-gaps.json
Public Readiness          apps/web/scripts/public-readiness-audit.mjs
Current Browser matrix    apps/web/scripts/public-current-browser-audit.mjs
Historical P8B owner      apps/web/scripts/public-browser-audit.mjs
Production Smoke          .github/workflows/production-smoke.yml
Sitemap                   apps/web/public/sitemap.xml
Content QA                apps/web/scripts/verify-content-qa.mjs
SEO QA                    apps/web/scripts/verify-seo-qa.mjs
R12A contract gate        .github/workflows/release-r12a-legal-support.yml
```

### Audit findings and implemented decisions

1. About and Support previously used `mock-site.ts`, which fetched both provider status APIs on provider-neutral pages despite route inventory `apis: []`.
2. `static-page.ts` now installs shared shell behavior without provider status requests, and About/Support use it.
3. GA4 measurement `G-YHX7HS1VBK` is injected into built HTML; Privacy describes that behavior.
4. `/contact/` is now the owned contact surface; the existing Google Form remains the external submission channel.
5. Support keeps the current Stripe Payment Link and one-time support wording; external Stripe account/dashboard facts remain R12B evidence items.
6. Five candidate legal routes are Vite inputs, route-inventory entries, sitemap entries, Content QA/SEO QA subjects, Public Readiness subjects, current browser matrix subjects, and Production Smoke subjects.
7. Public Browser ownership is split: P8B historical evidence remains locked in the permanent ledger, while current candidate routes are tested locally at 1440/820/390/360. Exact post-merge production verification remains Production Smoke ownership.
8. Current gap inventory has zero `missing_surfaces`; the five pages are `candidate_surfaces` until R12A hosted production acceptance.
9. Shared footer Contact is an internal route and Terms, Privacy, Refund Policy, and Commercial Disclosure are globally discoverable.
10. Phase 11 historical 20-route acceptance evidence remains permanent, while the retained current ownership gate now covers 25 routes.

## Candidate inventory

```text
Vite HTML inputs: 25
Explicit not-found pages: 1
Inventory entries: 26
Indexable routes: 21
Noindex routes: 4
Sitemap routes: 21
Public Readiness configured pages: 25
Production Smoke page routes: 25
Current candidate browser scenarios: 25 routes x 4 widths = 100
Historical P8B baseline: 21 routes / 84 production scenarios / 5 missing probes / 10 History scenarios
```

## R12A implementation state

```text
R12A-0 current legal/support surface audit: complete
R12A-1 shared legal/support page foundation: complete
R12A-2 Contact, Terms, Privacy: complete
R12A-3 Refund Policy and Commercial Disclosure: complete
R12A-4 About/footer and route ownership integration: complete
R12A-5 candidate and hosted acceptance: active
```

## R12A-5 required evidence

```text
Development policy: pending latest head
R12A contract gate: pending latest head
Public Surface Inventory: pending latest head
Public Readiness: pending latest head
Current Browser matrix 100 scenarios: pending latest head
Typecheck/build: pending latest head
Hosted production evidence: pending merge and exact production SHA
```

## Open later-phase evidence items

```text
R12B actual Payment Link destination: repository URL known; hosted configuration audit pending
R12B Stripe registered website evidence: pending external operator evidence audit
R12B refund configuration evidence: pending external operator evidence audit
R12C launch asset inventory: pending
```

Do not convert external Stripe state from memory into a completion claim. Record the evidence source and date when R12B begins.
