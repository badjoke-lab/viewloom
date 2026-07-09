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
R12C-0 closeout: `../operations/r12c0-message-inventory-2026-07-09.md`
R12C-1 source package: `../product/english-launch-copy.md`
R12C-1 structured package: `../audits/r12c1-launch-copy-package.json`
R12C-1 acceptance: `../operations/r12c1-launch-copy-acceptance-2026-07-09.md`
R12C-2 capture evidence: `../audits/r12c2-launch-assets-capture.json`
R12C-2 asset manifest: `../audits/r12c2-launch-asset-manifest.json`
R12C-2 captions: `../product/launch-asset-captions.md`
R12C-2 acceptance: `../operations/r12c2-launch-assets-acceptance-2026-07-09.md`
Current workstream: R12C-3 release candidate acceptance
Exact next implementation branch: `work-release-r12c3-release-candidate-acceptance`
Next branch created: no

## Workstreams

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete through R12B-2
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 release candidate acceptance                active
```

## Retained R12B evidence boundary

R12B is complete through R12B-2. Current Stripe Dashboard/account facts not directly proven remain pending external evidence. Repository or public-browser behavior must not be used to claim the current registered website value, account review state, Payment Link dashboard configuration, recurring configuration, or refund configuration.

Permanent R12B evidence:

```text
docs/audits/r12b-evidence-and-configuration-audit.json
docs/audits/r12b-repository-consistency-notes.md
docs/operations/r12b0-evidence-audit-2026-07-09.md
docs/operations/r12b1-support-transition-acceptance-2026-07-09.md
docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md
```

## R12C-0 closeout

Permanent evidence:

```text
docs/audits/r12c0-message-inventory.json
docs/audits/r12c0-message-inventory.md
docs/operations/r12c0-message-inventory-2026-07-09.md
```

R12C-0 inventoried product identity messages, provider messages, seven product roles, coverage/cadence/retention boundaries, provider separation, route links, FAQ source material, terminology candidates, existing share assets, and missing R12C-1/R12C-2 deliverables.

## R12C-1 closeout

Permanent package:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md
scripts/verify-r12c1-launch-copy-package.mjs
```

R12C-1 accepted:

```text
one-line description
short listing description
long description
Heatmap / Day Flow / Battle Lines / History role summaries
Channel / Local Watchlist / Status role summaries
Twitch Top 300 observed-window boundary
Kick up-to-100 observed-candidate boundary
plain-language Kick candidate explanation
provider separation explanation
5-minute collection cadence explanation
up-to-180-day public daily rollup explanation
12-question FAQ
Status/help link package
Support/legal link package
terminology contract
```

The English source package is the future Phase 13–14 localization source after the approved program reaches those phases.

R12C-1 preserves these non-claim boundaries:

```text
no complete-platform-coverage claim
no official-analytics claim
no unique-viewer claim
no exact creator revenue claim
no exact session reconstruction claim
no causal explanation for audience movement
no combined Twitch/Kick audience total
no cross-platform ranking
no Twitch-parity Kick directory-coverage claim
no charitable-donation framing for the support flow
```

## R12C-2 closeout

Permanent package:

```text
apps/web/public/launch-assets/
docs/audits/r12c2-launch-assets-capture.json
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md
scripts/freeze-r12c2-launch-assets.mjs
scripts/verify-r12c2-launch-assets-capture.mjs
scripts/verify-r12c2-launch-assets-package.mjs
.github/workflows/release-r12c2-launch-assets.yml
```

Accepted asset matrix:

```text
Portal desktop      /                         1440x1000
Portal mobile       /                          390x844
Twitch Heatmap      /twitch/heatmap/          1440x1000
Twitch Day Flow     /twitch/day-flow/         1440x1000
Twitch Battle Lines /twitch/battle-lines/     1440x1000
Twitch History      /twitch/history/          1440x1000
```

Permanent capture evidence records six assets, zero violations, HTTP 200 for every asset, matching canonicals, no horizontal overflow, and no remaining loading text. The package verifier checks manifest facts against permanent capture evidence and verifies actual repository PNG byte size and SHA-256 values.

The package uses current product surfaces rather than invented mockups. Captions remain bounded by the R12C-1 English source package.

## R12C-3 active acceptance boundary

Required candidate checks:

```text
full web typecheck
production build
public-surface inventory verification
Public Readiness
Public Browser Audit
affected responsive/accessibility gates
provider separation contracts
legal/support direct-link checks
outbound payment/support link checks
metadata/canonical/sitemap checks
deliberate hosted validation where required
exact production SHA smoke after merge
```

R12C-3 must create permanent Phase 12 release acceptance evidence after the exact production SHA and smoke evidence are known. Then canonical documents advance to Phase 12A Analytics Capture Foundation and this temporary working record is retired according to documentation governance.

## Capacity carry-forward

```text
Twitch: at-or-over-window 300/300
Kick:   at-or-over-window 100/100
```

These observations remain inputs to Phase 12A Analytics Capture Foundation. Phase 12A remains blocked until R12C-3 closes the full Phase 12 release acceptance.
