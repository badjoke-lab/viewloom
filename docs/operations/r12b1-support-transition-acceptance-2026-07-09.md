# R12B-1 Support page and payment transition acceptance — 2026-07-09

Status: complete
Phase: Phase 12
Workstream: R12B-1
Acceptance model: existing implementation accepted; no Support UI change required
Workflow run: `28963037083`
Artifact id: `8176871147`
Artifact digest: `sha256:98d92c559c9ddeda0d3307be01a213e13cb85406a0ee4333d211b47dbf0197c1`
Evidence head SHA: `1f4405ace2735f7a34f1989bd1988800bc442897`
Checked at: `2026-07-08T17:37:17.822Z`

## Accepted production behavior

The existing Support page passed the R12B-1 acceptance contract without a product/UI change.

```text
Route: /support/
Desktop 1440: pass
Mobile 390: pass
Violations: 0
Horizontal overflow: 0px desktop / 0px mobile
CTA name: Open Stripe payment page
CTA destination: https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03
CTA target: _blank
CTA rel: noreferrer
Desktop CTA size: 217x34px
Mobile CTA size: 217x44px
```

The 44px mobile action-target requirement is met exactly.

## Transition clarity accepted

Both required scenarios confirmed:

```text
Stripe-hosted payment explanation near CTA: present
payment processing destination explanation: present
one-time support wording on ViewLoom: present
no ViewLoom account explanation: present
no product tier explanation: present
Refund Policy link: present
Commercial Disclosure link: present
Contact link: present
secret-like Stripe credential token in public DOM text: none
```

## Evidence boundary

R12B-1 validates public transition behavior only. It does not claim:

```text
current Stripe Dashboard registered website value
current Stripe account approval/review state
current Payment Link Dashboard configuration
current recurring/subscription configuration
current refund configuration
```

Those remain governed by the R12B-0 evidence boundary and explicitly pending external evidence where not directly proven.

## Decision

R12B-1 is complete as acceptance-only work. The existing Support page already satisfies the approved transition contract, so changing CTA copy or layout merely to create implementation work would be unnecessary.

The next workstream is R12B-2 refund/disclosure consistency acceptance.
