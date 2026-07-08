# Phase 12 English release readiness working record

Status: active
Phase: Phase 12
Specification: `../product/release-readiness-spec.md`
Implementation plan: `../product/release-readiness-plan.md`
Phase 11 entry evidence: `../operations/phase11-production-closeout-2026-07-08.md`
R12A baseline: `../audits/phase12-r12a-legal-support-baseline.json`
R12A production evidence: `../audits/r12a-production-acceptance.json`
R12A human record: `../operations/r12a-production-acceptance-2026-07-08.md`
R12B audit: `../audits/r12b-evidence-and-configuration-audit.json`
Current workstream: R12B-0 evidence and configuration audit
Active branch: `work-release-r12b-stripe-support-flow`
Branch created: yes

## Workstreams

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             active
R12C English launch package and release acceptance queued
```

## R12A closeout

```text
Implementation PR: #477
Implementation merge SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Production workflow run: 28941169278
Expected/deployed SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Owned HTML routes: 25
Provider status APIs: 2
Provider crossing failures: 0
Blocking monitoring alerts: 0
Watch alerts: 2
Explicit 404: pass
Result: pass
```

Accepted R12A routes:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

The five routes are resolved surfaces. `static_legal` is accepted under the current contract. Historical P8B missing-surface evidence remains separately preserved and is not rewritten.

## R12B-0 audit state

```text
Repository facts: confirmed
Hosted public behavior: pending CI evidence
Prior external correspondence: recorded as historical evidence only
Current Stripe Dashboard state: pending external evidence
```

The permanent audit owner is `docs/audits/r12b-evidence-and-configuration-audit.json`.

R12B Hosted Audit ownership:

```text
Workflow: .github/workflows/release-r12b-evidence-audit.yml
Browser runner: apps/web/scripts/r12b-hosted-support-audit.mjs
Evidence verifier: scripts/verify-r12b-hosted-support-audit.mjs
Required viewports: desktop 1440 / mobile 390
No payment submission: required
```

## R12B-0 repository facts

The repository currently contains:

```text
Support route: /support/
Payment model wording: one-time support
Payment Link: https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03
CTA label: Open Stripe payment page
External target: _blank
External rel: noreferrer
Refund route: /refund-policy/
Commercial Disclosure route: /commercial-disclosure/
Contact route: /contact/
Contact submission channel: external Google-hosted form
```

These repository facts do not prove external Stripe dashboard or account state.

## Prior external correspondence boundary

The 2026-06-09 project record preserves prior Stripe specialist guidance as historical external evidence:

```text
vl.badjoke-lab.com was supportable as the ViewLoom business website
registered website should be changed from the old Livefield URL before using the existing Payment Link on ViewLoom
Support / Support ViewLoom wording should be used instead of charitable donation wording
Commercial Disclosure surface was required for the support flow
```

This historical record does not prove the current Stripe Dashboard website value, current account state, current Payment Link settings, or current refund configuration.

## R12B-0 evidence questions

Audit and record separately:

```text
1. actual public Payment Link destination and hosted behavior
2. Support CTA wording consistency
3. Payment Link one-time/recurring behavior visible to the user
4. refund wording consistency across Support, Refund Policy, and Stripe-hosted surface
5. Commercial Disclosure consistency
6. desktop external transition flow
7. mobile external transition flow
8. registered business website/domain evidence
9. external Stripe configuration evidence source and date
10. any missing external evidence that blocks completion
```

## External evidence boundary

Do not infer these facts from repository code or public browser behavior alone:

```text
Stripe registered business website is current
Stripe account approval/state is unchanged
Payment Link dashboard configuration matches repository wording
refund configuration is enabled or disabled in a particular way
recurring payments are impossible solely because the site copy says one-time
```

Where direct authoritative evidence is unavailable, keep the item pending rather than inventing completion.

## Capacity carry-forward

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

These non-blocking watch observations remain inputs to Phase 12A Analytics Capture Foundation. R12B does not change observed windows, retention, cron, collector, D1 schema, or provider separation.

## Stop rule

R12B-0 closes only after hosted public evidence is captured and the permanent audit record is updated from that evidence. Missing current dashboard/account evidence may remain explicitly pending; it must not be silently converted into a completion claim.
