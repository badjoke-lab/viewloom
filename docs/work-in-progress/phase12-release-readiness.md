# Phase 12 English release readiness working record

Status: active
Phase: Phase 12
Specification: `../product/release-readiness-spec.md`
Implementation plan: `../product/release-readiness-plan.md`
Phase 11 entry evidence: `../operations/phase11-production-closeout-2026-07-08.md`
R12A production evidence: `../audits/r12a-production-acceptance.json`
R12B-0 audit: `../audits/r12b-evidence-and-configuration-audit.json`
R12B-0 operation record: `../operations/r12b0-evidence-audit-2026-07-09.md`
R12B-1 acceptance: `../operations/r12b1-support-transition-acceptance-2026-07-09.md`
Current workstream: R12B-1 Support page and payment transition acceptance
Active branch: `work-release-r12b1-support-transition`
Branch created: yes
R12B-0 completion: complete
R12B-1 completion: complete
Next after R12B-1 merge: R12B-2 refund/disclosure consistency acceptance

## Retained transition history

Before R12B execution began, the canonical handoff state was:

```text
Current workstream: R12B-0 evidence and configuration audit
Exact next implementation branch: `work-release-r12b-stripe-support-flow`
Next branch created: no
```

R12B-0 then executed on `work-release-r12b-stripe-support-flow` and merged through PR #481.

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

## R12B-0 closeout

```text
PR: #481
Merge SHA: dcdedebc1e491c3dbab95149d1a46c38b6d2aeae
Repository facts: confirmed
Hosted public behavior: confirmed
Prior external correspondence: historical evidence only
Current Stripe Dashboard state: pending external evidence
Permanent audit completion: complete
```

Permanent R12B-0 evidence:

```text
docs/audits/r12b-evidence-and-configuration-audit.json
docs/audits/r12b-repository-consistency-notes.md
docs/operations/r12b0-evidence-audit-2026-07-09.md
```

R12B-0 hosted evidence:

```text
Workflow run: 28962351393
Artifact id: 8176591285
Artifact digest: sha256:e419abdc27d24b1628c5a35cab55712146f1b6e0523094ad3df48fdf182395ad
Final public hostname: buy.stripe.com
Visible Stripe label: Support ViewLoom
Visible amount: US$10.00
Explicit one-time wording on Stripe visible text: not detected
Explicit recurring wording on Stripe visible text: not detected
Payment submission: not performed
```

## R12B-1 acceptance

R12B-1 was evaluated as acceptance-only work. The existing Support page passed the approved transition contract without a product/UI change.

```text
Workflow run: 28963037083
Artifact id: 8176871147
Artifact digest: sha256:98d92c559c9ddeda0d3307be01a213e13cb85406a0ee4333d211b47dbf0197c1
Evidence head SHA: 1f4405ace2735f7a34f1989bd1988800bc442897
Desktop 1440: pass
Mobile 390: pass
Violations: 0
Horizontal overflow: 0px desktop / 0px mobile
CTA name: Open Stripe payment page
Desktop CTA size: 217x34px
Mobile CTA size: 217x44px
Stripe-hosted transition explanation: present
Refund Policy link: present
Commercial Disclosure link: present
Contact link: present
Secret-like Stripe credential token in public DOM: none
```

The mobile CTA meets the 44px action-target rule exactly. No unnecessary Support copy or layout change is authorized by the evidence.

Permanent R12B-1 evidence:

```text
docs/operations/r12b1-support-transition-acceptance-2026-07-09.md
scripts/verify-r12b1-acceptance-record.mjs
apps/web/scripts/r12b1-support-transition-browser.mjs
scripts/verify-r12b1-support-transition.mjs
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

## R12B-1 decision

R12B-1 is complete as acceptance-only work. The existing Support page already satisfies the approved payment-transition contract.

After this R12B-1 acceptance PR merges, proceed to R12B-2 refund/disclosure consistency acceptance.

## Capacity carry-forward

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

These non-blocking watch observations remain inputs to Phase 12A Analytics Capture Foundation. R12B does not change observed windows, retention, cron, collector, D1 schema, or provider separation.
