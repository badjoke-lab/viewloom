# R12B repository consistency notes

Status: active audit evidence
Phase: Phase 12
Workstream: R12B-0
Updated: 2026-07-09

## Repository consistency findings

The current repository public copy is internally aligned on the following bounded statements:

```text
support model: voluntary one-time support
processor surface: Stripe-hosted payment page
ViewLoom account created by support: no
product tier unlocked by support: no
ranking/editorial influence purchased by support: no
refund handling: generally final, with mistake/duplicate/unauthorized/technical-error review path
refund contact route: /contact/
commercial disclosure route: /commercial-disclosure/
```

The Support page exposes Refund Policy and Commercial Disclosure links before the external payment transition.

The Refund Policy states that the public support flow is described as one-time and does not present a recurring subscription cancellation flow on ViewLoom.

The Commercial Disclosure uses the same bounded wording: the current public Support page describes a one-time support flow and does not present a recurring subscription flow.

## Deliberate non-claims

The repository does not prove:

```text
current Stripe Dashboard registered website value
current Stripe account approval/review state
current Payment Link dashboard configuration
current recurring/subscription configuration in Stripe
current refund configuration in Stripe Dashboard
```

The hosted browser audit may establish only public behavior and visible wording. Dashboard/account facts remain a separate evidence class.

## Current audit decision

No repository wording conflict requiring immediate R12B-1 copy changes has been identified at R12B-0 baseline. Hosted public behavior must be checked before that decision is final.
