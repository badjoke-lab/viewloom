# Phase 12 English release readiness working record

Status: active
Phase: Phase 12
Specification: `../product/release-readiness-spec.md`
Implementation plan: `../product/release-readiness-plan.md`
Phase 11 entry evidence: `../operations/phase11-production-closeout-2026-07-08.md`
R12A production evidence: `../audits/r12a-production-acceptance.json`
R12B-0 audit: `../audits/r12b-evidence-and-configuration-audit.json`
R12B-1 acceptance: `../operations/r12b1-support-transition-acceptance-2026-07-09.md`
R12B-2 acceptance: `../operations/r12b2-refund-disclosure-acceptance-2026-07-09.md`
R12C-0 inventory: `../audits/r12c0-message-inventory.json`
R12C-0 notes: `../audits/r12c0-message-inventory.md`
R12C-0 closeout: `../operations/r12c0-message-inventory-2026-07-09.md`
Current workstream: R12C-1 launch copy and FAQ
Exact next implementation branch: `work-release-r12c1-launch-copy-faq`
Next branch created: no

## Workstreams

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete through R12B-2
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         active
R12C-2 launch/share asset package                  queued
R12C-3 release candidate acceptance                queued
```

## Retained R12B evidence boundary

R12B is complete through R12B-2. Permanent evidence remains:

```text
docs/audits/r12b-evidence-and-configuration-audit.json
docs/audits/r12b-repository-consistency-notes.md
docs/operations/r12b0-evidence-audit-2026-07-09.md
docs/operations/r12b1-support-transition-acceptance-2026-07-09.md
docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md
```

R12B execution:

```text
R12B-0 PR: #481
R12B-0 merge SHA: dcdedebc1e491c3dbab95149d1a46c38b6d2aeae
R12B-1 PR: #482
R12B-1 merge SHA: 1bcc9590f4ca04202a8155e8d10862f91d73cc7f
R12B-2 PR: #483
R12B-2 merge SHA: eeeb41fc337b220bb48f28d7d2ed1b81664e02a6
```

Current Stripe Dashboard/account facts not directly proven remain pending external evidence. Repository or public-browser behavior must not be used to claim the current registered website value, account review state, Payment Link dashboard configuration, recurring configuration, or refund configuration.

## R12C-0 closeout

R12C-0 completed an evidence inventory before launch-copy writing.

Permanent evidence:

```text
docs/audits/r12c0-message-inventory.json
docs/audits/r12c0-message-inventory.md
docs/operations/r12c0-message-inventory-2026-07-09.md
```

Inventory completed:

```text
Portal/About product identity source messages
Twitch/Kick provider messages
Heatmap / Day Flow / Battle Lines / History roles
Channel / Local Watchlist / Status utility roles
5-minute cadence wording
up-to-180-day rollup retention wording
Twitch Top 300 observed-window boundary
Kick Top 100 observed-candidate boundary
provider-separation explanation
viewer-count and viewer-minutes boundaries
state semantics
Status/help/support/legal link map
FAQ source material
English terminology candidates
current generic OG asset
CI screenshot evidence source
R12C-1 message gaps
R12C-2 asset gaps
```

Current product source messages preserved in the inventory include:

```text
Live-stream data, separated by platform
Observe the field. Then follow the movement.
A narrow tool, built around distinct questions.
```

These are evidence sources, not automatic approval of every current sentence as final launch copy.

## R12C-1 active scope

R12C-1 owns:

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

Required R12C-0 message gaps handed to R12C-1:

```text
central approved description set
unified FAQ
plain-language Kick candidate-coverage explanation
evidence-bounded retention explanation
launch-package link map
Channel role decision
Local Watchlist role decision
```

R12C-1 must preserve these non-claim boundaries:

```text
no complete-platform-coverage claim
no official-analytics claim
no unique-viewer claim
no exact creator revenue claim
no exact session reconstruction claim
no combined Twitch/Kick audience total
no cross-platform ranking
no Twitch-parity Kick directory-coverage claim
no donation/charitable-donation framing for the support flow
```

## R12C-2 queued asset boundary

Current repo-owned generic share asset:

```text
apps/web/public/og/viewloom.svg
1200x630
```

Public Browser screenshots are CI acceptance artifacts, not a curated launch package. R12C-2 still owns curated desktop/mobile and representative feature screenshots plus an asset manifest and bounded caption set.

## Capacity carry-forward

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

These observations remain inputs to Phase 12A Analytics Capture Foundation. Phase 12A remains blocked until R12C-3 closes the full Phase 12 release acceptance.
