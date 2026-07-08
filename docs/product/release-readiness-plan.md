# ViewLoom Phase 12 English release readiness implementation plan

Status: active implementation plan
Version: 1.0
Created: 2026-07-08
Specification: `release-readiness-spec.md`
Roadmap phase: Phase 12
Active working record: `../work-in-progress/phase12-release-readiness.md`

## 1. Purpose

This plan executes Phase 12 in three bounded workstreams:

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

The plan completes the English public release surface before Phase 12A analytics capture and Phase 13–14 localization.

## 2. Entry state

Phase 12 enters from:

```text
Phase 11 candidate PR: #473
Phase 11 analytics-roadmap synchronization PR: #475
Phase 11 production closeout record: docs/operations/phase11-production-closeout-2026-07-08.md
Phase 11 hosted closeout evidence: pass
```

The exact first implementation branch is created only after the Phase 11 closeout/canonical synchronization PR merges.

Recommended first branch:

```text
work-release-r12a-legal-support
```

## 3. Global Phase 12 PR rules

Every Phase 12 PR must state:

```text
Roadmap phase
R12 workstream
Affected routes
Provider request behavior
Build-input changes
Public inventory changes
Readiness ownership changes
Production Smoke ownership changes
Sitemap/indexability changes
Metadata/canonical changes
Responsive/browser matrix
External Stripe evidence used, if any
```

Every implementation preserves provider separation and must not introduce analytics storage/runtime work.

## 4. R12A — legal and support public-surface completion

R12A should be divided into evidence-first and implementation slices so route counts and ownership are measured rather than guessed.

### R12A-0 — current legal/support surface audit

Tasks:

- inspect current About, Support, Changelog, shared navigation, and footer ownership;
- inspect Vite inputs, sitemap generation, Public Readiness, Production Smoke, public-surface inventory, metadata helpers, and not-found conventions;
- verify the five currently missing routes against the current repository and production surface;
- map exact owner files and existing reusable shell/style components;
- record whether each legal route should be indexable.

Completion:

- one permanent/working evidence table records current route presence, owner, intended robots policy, sitemap policy, canonical, browser gate, readiness owner, and production owner;
- no public runtime change in this slice.

### R12A-1 — shared legal/support page foundation

Tasks:

- create reusable page structure for long-form legal/support content;
- preserve shared shell and footer ownership;
- define consistent heading, section, link, contact, and disclosure patterns;
- avoid five unrelated copy-pasted page implementations where shared structure is practical;
- verify 1440/820/390/360 wrapping and focus behavior.

Completion:

- shared foundation can render all five routes;
- no provider request is made by provider-neutral legal routes;
- accessibility and responsive contract has targeted tests.

### R12A-2 — Contact, Terms, Privacy

Tasks:

- add `/contact/`;
- add `/terms/`;
- add `/privacy/`;
- use only truthful current integrations and data behavior;
- link from the shared footer and appropriate About/Support surfaces.

Completion:

- routes build and direct-link correctly;
- metadata/canonical/robots decisions are explicit;
- page content is English source-language quality, not placeholder copy.

### R12A-3 — Refund Policy and Commercial Disclosure

Tasks:

- add `/refund-policy/`;
- add `/commercial-disclosure/`;
- align wording with the actual support/payment model and operator obligations;
- keep required legal/operator information exact;
- structure content so Phase 13–14 localization ownership is clear.

Completion:

- no promise conflicts with the actual Stripe/support flow;
- no hidden or placeholder operator fields remain in the public accepted page;
- legal review responsibility and source ownership are documented.

### R12A-4 — About/footer and route ownership integration

Tasks:

- audit About independent/unofficial wording and bounded coverage explanation;
- complete shared footer legal/support links;
- update Vite inputs and route manifests;
- update public-surface inventory and gap record from actual implementation;
- update Public Readiness ownership;
- update Production Smoke route ownership;
- update sitemap/indexability and canonical checks;
- add browser matrix coverage for new routes and footer navigation.

Completion:

- actual route counts agree across build, inventory, readiness, and smoke ownership;
- provider-neutral pages issue no inappropriate provider requests;
- no page-level overflow at required widths;
- keyboard and touch navigation pass.

### R12A-5 — R12A candidate and hosted acceptance

Tasks:

- run latest-head typecheck/build/shared contracts;
- run route inventory/readiness/browser gates;
- use Preview only if real Cloudflare runtime validation is necessary;
- merge accepted candidate;
- verify exact production SHA and public smoke;
- record permanent R12A acceptance evidence.

Completion:

- five new routes are production-verified;
- About/footer audit is closed;
- R12B becomes active.

## 5. R12B — Stripe and support-flow readiness

R12B combines repository inspection with external account/dashboard evidence. Repository code alone is insufficient to prove external Stripe state.

### R12B-0 — evidence and configuration audit

Tasks:

- inspect current Support page wording and outbound link handling;
- identify the actual Payment Link destination configured for ViewLoom;
- record operator evidence for the registered business website/domain state;
- record supported payment model and refund handling;
- compare Support, Refund Policy, Commercial Disclosure, and external flow wording.

Completion:

- a permanent audit record distinguishes repository facts from external Stripe facts;
- any missing external evidence remains explicitly pending.

### R12B-1 — Support page and payment transition

Tasks:

- align CTA wording with approved support model;
- provide clear transition to Stripe-hosted payment UI;
- mark external destination appropriately;
- preserve accessible names and mobile target size;
- avoid exposing secret/payment credentials;
- ensure no subscription/recurrence promise unless actually configured and approved.

Completion:

- desktop and mobile flow pass;
- user can understand they are leaving ViewLoom for Stripe-hosted payment processing;
- legal/refund links are available before payment transition.

### R12B-2 — refund/disclosure consistency acceptance

Tasks:

- compare all public support/payment/refund/disclosure wording;
- verify actual public links;
- verify mobile flow and external navigation behavior;
- record screenshots/evidence where useful;
- record external configuration evidence source and date.

Completion:

- no wording conflict remains;
- no unsupported dashboard-state claim is made;
- R12C becomes active.

## 6. R12C — English launch package and release acceptance

### R12C-0 — message inventory

Tasks:

- collect current Portal/About feature descriptions;
- inventory current public screenshots and share assets;
- identify missing limitations, Status, FAQ, support, and legal explanations;
- define one approved English terminology set.

### R12C-1 — launch copy and FAQ

Produce and integrate as appropriate:

```text
one-line description
short listing description
long description
feature-role summary
coverage limitations
provider separation explanation
retention explanation
FAQ
Support/legal links
Status/help links
```

Copy must remain evidence-bounded.

### R12C-2 — launch/share asset package

Tasks:

- select or create repo-owned screenshots/images needed for external listings;
- ensure mobile and desktop representative states are current;
- avoid stale UI or unsupported data claims in images/captions;
- record source route, viewport, date, and intended use for generated screenshots when practical.

### R12C-3 — release candidate acceptance

Required final checks include:

- full web typecheck;
- production build;
- public-surface inventory verification;
- Public Readiness;
- Public Browser Audit;
- affected responsive/accessibility gates;
- provider separation contracts;
- legal/support direct-link checks;
- outbound payment/support link checks;
- metadata/canonical/sitemap checks;
- deliberate hosted validation where required;
- exact production SHA smoke after merge.

### R12C completion

Create permanent Phase 12 release acceptance evidence. Update canonical documents, delete the Phase 12 temporary working note, and set Phase 12A Analytics Capture Foundation as exact next.

## 7. Stop rules

After each merged workstream or acceptance slice:

1. update permanent/working evidence;
2. update current schedule when the active workstream changes;
3. report exact merged/production state;
4. stop before creating a later branch unless continuation is explicitly requested.

Do not begin Phase 12A data/schema work before Phase 12 release acceptance closes.

## 8. Phase 12 completion criteria

Phase 12 completes only when:

```text
R12A five routes production accepted
About/footer audit closed
route ownership systems synchronized
R12B external Stripe evidence recorded
Support/Payment Link flow accepted
refund/disclosure wording consistent
R12C English launch package complete
FAQ and limitations complete
latest-head CI/browser gates pass
exact production SHA smoke passes
English source ready for localization
Phase 12 temporary note retired
canonical next = Phase 12A Analytics Capture Foundation
```
