# R12B-0 evidence and configuration audit — 2026-07-09

Status: complete
Phase: Phase 12
Workstream: R12B-0
Permanent audit: `../audits/r12b-evidence-and-configuration-audit.json`
Repository consistency record: `../audits/r12b-repository-consistency-notes.md`
Hosted workflow run: `28962351393`
Hosted artifact id: `8176591285`
Artifact digest: `sha256:e419abdc27d24b1628c5a35cab55712146f1b6e0523094ad3df48fdf182395ad`
Evidence head SHA: `e77ab5b24aa2b7df7bc400294ef01512c76a90e0`

## Evidence classes

R12B-0 separates:

```text
repository facts
hosted public behavior
prior external correspondence
current external dashboard/account state
```

Repository and hosted evidence must not be used to infer current Stripe Dashboard settings.

## Repository facts accepted

```text
Support route: /support/
Payment Link: https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03
CTA label: Open Stripe payment page
CTA target: _blank
CTA rel: noreferrer
Support wording: one-time support
Refund Policy: /refund-policy/
Commercial Disclosure: /commercial-disclosure/
Contact: /contact/
```

## Hosted public evidence accepted

```text
/support/: 200
/refund-policy/: 200
/commercial-disclosure/: 200
/contact/: 200
Desktop transition: pass
Mobile transition: pass
Final public hostname: buy.stripe.com
Visible Stripe label: Support ViewLoom
Visible amount: US$10.00
Change amount control: visible
Explicit one-time wording on Stripe visible text: not detected
Explicit recurring wording on Stripe visible text: not detected
Payment submission: not performed
```

Refund Policy, Commercial Disclosure, and Contact links were available before transition in both required scenarios.

## Prior external correspondence boundary

The project record dated 2026-06-09 preserves prior Stripe specialist guidance that:

```text
vl.badjoke-lab.com was supportable as the ViewLoom business website
the registered website should be updated from the old Livefield URL before using the existing Payment Link on ViewLoom
Support / Support ViewLoom wording should be used instead of charitable donation wording
a commercial disclosure surface was required for the support flow
```

This is historical evidence. It is not a claim about current Stripe Dashboard state.

## Explicitly pending external evidence

```text
current registered business website/domain value in Stripe Dashboard
current Stripe account approval/review state
current Payment Link dashboard configuration
current recurring/subscription configuration
current refund configuration or dashboard policy settings
```

These pending items do not get converted into completion claims.

## Decision

R12B-0 is complete under its defined completion contract: the permanent audit separates repository facts from external facts, hosted public behavior is recorded, and missing external evidence is explicitly pending.

No repository wording conflict or hosted transition defect requiring immediate copy changes was found. The next workstream is R12B-1 Support page and payment transition acceptance.
