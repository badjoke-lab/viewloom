# About and Support QA Contract

This document records the current content contract for About, Support, and the Phase 12 R12A legal/support surfaces.

- About, Support, Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure must keep the current dark shell and `data-provider="portal"`.
- These provider-neutral pages must use `static-page.ts` rather than the provider-status runtime entry and must not issue Twitch or Kick status API requests.
- All seven pages must keep global navigation, masthead, footer ownership, an internal `/contact/` link, and the analytics entry.
- About must keep `.prose` content explaining separation of views, observed numbers, coverage/missing data, and independence.
- Support must keep `.support-options`, the current Stripe Payment Link, policy links, one-time support wording, and the statement that support does not influence rankings or coverage.
- Contact must keep the owned `/contact/` surface, the current external Google Form submission channel, platform-support boundary, and warning not to submit sensitive payment credentials.
- Terms must keep independent/unofficial status, bounded coverage, availability, acceptable-use, third-party, advice, support-payment, and disclaimer boundaries.
- Privacy must describe the current GA4 measurement ID, browser-local Watchlist storage, Google-hosted contact form, Stripe-hosted payment page, absence of ViewLoom user accounts, and hosting/operational boundary truthfully.
- Refund Policy must keep voluntary one-time support context, general-finality wording, applicable-law savings language, payment-error review path, original-payment-method handling, and payment-credential warning.
- Commercial Disclosure must keep transaction information, on-request operator detail mechanism, Contact and Refund links, current one-time support boundary, and the official Consumer Affairs Agency guide reference.
- The shared footer must expose internal Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes.
- A future change that restores mock labels, fake status claims, provider API requests on provider-neutral pages, placeholder legal copy, unsupported recurring-payment claims, or removes independence/support limitations is a regression.
