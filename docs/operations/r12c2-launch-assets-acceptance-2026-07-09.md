# R12C-2 launch/share asset acceptance

Status: complete
Phase: Phase 12
Workstream: R12C-2
Date: 2026-07-09
Implementation PR: #486

## Accepted package

R12C-2 accepts six current production-surface screenshots as the repo-owned launch/share asset package:

```text
viewloom-desktop.png      /                         1440x1000
viewloom-mobile.png       /                          390x844
twitch-heatmap.png        /twitch/heatmap/          1440x1000
twitch-day-flow.png       /twitch/day-flow/         1440x1000
twitch-battle-lines.png   /twitch/battle-lines/     1440x1000
twitch-history.png        /twitch/history/          1440x1000
```

Package ownership:

```text
apps/web/public/launch-assets/
docs/audits/r12c2-launch-assets-capture.json
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
```

Implementation and verification ownership:

```text
apps/web/scripts/r12c2-launch-assets-browser.mjs
scripts/freeze-r12c2-launch-assets.mjs
scripts/verify-r12c2-launch-assets-capture.mjs
scripts/verify-r12c2-launch-assets-package.mjs
.github/workflows/release-r12c2-launch-assets.yml
```

## Capture acceptance

Permanent capture evidence records:

```text
origin: https://vl.badjoke-lab.com
checked_at: 2026-07-09T03:09:05.031Z
result: pass
assets: 6
violations: 0
```

For every accepted asset, the evidence records source route, viewport, provider, intended external use, bounded caption, HTTP status, title, H1, canonical URL, horizontal overflow, remaining loading text, PNG SHA-256, and byte size.

The accepted evidence has:

```text
HTTP 200:                  6 / 6
canonical match:           6 / 6
horizontal overflow <= 2: 6 / 6
loading text remaining:    0
capture violations:        0
```

## Package verification

The frozen package verifier passed on:

```text
workflow: Release R12C2 Launch Assets
run: 28991498796
head: 9b57de076b9265b87173c8215ef70f582ae2e400
result: pass
```

That verifier checks the permanent capture evidence, manifest metadata, expected six asset identities/routes/viewports/providers, HTTP and canonical facts, overflow and loading-state facts, intended-use and caption metadata, binary byte sizes, and actual repository PNG SHA-256 values.

## Caption and claim boundary

The caption package is bounded by the accepted R12C-1 English source-language package.

The package does not authorize claims of:

```text
complete platform coverage
official Twitch or Kick analytics
unique viewers
exact creator revenue
exact session reconstruction
causal explanations for audience movement
combined Twitch/Kick audience totals
cross-platform rankings
```

Twitch and Kick remain separate providers. The accepted images are production-surface screenshots, not invented product mockups.

## Closeout

R12C-2 is complete.

The next active workstream is R12C-3 release candidate acceptance. R12C-3 owns the full latest-head candidate checks, browser/readiness/support/legal/provider-separation verification, and exact production SHA smoke required to close Phase 12.
