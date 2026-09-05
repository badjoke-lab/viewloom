# Twitch Stream Map Country closeout — 2026-09-05

Status: accepted closeout record  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Accepted main: `24cd444bfe564588b70c16a335f07d2c41627c0b`

## Decision

The Twitch Country lane is closed at the current product boundary.

Country remains available for scoped defects, accessibility work and reviewed-evidence quality maintenance, but it is no longer the next Stream Map feature-development gate. The next mainline product gate is the Twitch City visualization / interaction specification.

This closeout does not authorize any collector, D1, schema, binding, cadence, retention, backfill, cross-provider or Current/IRL change.

## Accepted implementation anchors

- PR #1213 finalized filled Country regions as the primary Country renderer.
- PR #1218 finalized the compact Country interaction model and effective content order.
- PR #1220 removed the remaining marker-first static copy and the stale validator assertion that encoded it.
- Main `24cd444bfe564588b70c16a335f07d2c41627c0b` is the accepted closeout baseline.

## Renderer contract verified

The accepted Country behavior is:

```text
primary visualization        filled Country regions / choropleth
ordinary Country markers     suppressed during normal choropleth operation
small-country fallback       aggregate Country selector only
creator coordinates          not implied or published
intensity metrics            Streams / Viewers
positive-value buckets       five log-scaled buckets
Country selection            persistent and independent of camera
selection camera movement    none automatically
World view                   explicit camera reset
Clear country                selection reset only
mobile world overview        bounded
Country max zoom             bounded
```

The retired public Markers/Regions A/B switch is not part of the accepted product.

## Effective Country content order

The runtime contract accepted in #1218 remains:

```text
Map
-> selected Country when present
-> mapped countries / mapped streams
-> unmapped diagnostics
```

The static HTML source order is not the public runtime contract where the Country UI layer deliberately relocates those sections. Browser verification owns the effective order.

## Closeout finding repaired in #1220

The closeout audit found two stale marker-first assumptions after the choropleth rollout:

1. `apps/web/twitch/map/index.html` still said `Select a country marker` and `Country markers are buttons`.
2. `apps/web/scripts/verify-twitch-stream-map-country-drilldown.mjs` required the old marker phrase, turning stale copy into a regression constraint.

PR #1220 replaced the fallback HTML with renderer-neutral map/list selection language, explicitly described small-country fallback controls as aggregate selectors rather than creator locations, and added a renderer-contract guard against reintroducing the retired marker-first phrases.

## PR verification evidence

For #1220 final head `4e044309180794ee37824bbafbdf20f8979e180c`:

```text
Twitch Stream Map Renderer Bundle   run 33934118894 / #69   success
Public Browser Audit                run 33934118978 / #1486 success
Web checks                          run 33934118964 / #4486 success
Twitch Stream Map Geography Mode    run 33934118940 / #46   success
Public Readiness Audit              success
Public Surface Inventory            success
Navigation Checks                   success
Platform naming                     success
Category rollout policy             success
Deploy Web Pages PR verification    success
```

The first Web checks attempt before the final #1220 fix failed specifically because the old Country drilldown validator still required marker-first copy. That validator was updated, and the final run passed. The failed intermediate run is not acceptance evidence.

## Production evidence

After #1220 merged to main as `24cd444bfe564588b70c16a335f07d2c41627c0b`:

```text
Deploy Web Pages
run 33934879891
verify                         success
deploy                         success
Deploy production Pages        success

Twitch Map Production Browser Smoke
run 33934879840
smoke                          success
Verify production Country and City map rendering
                               success
```

This production smoke verifies that the Country closeout did not break the separately isolated City mode.

## Spec/code/test reconciliation result

No remaining contradiction was found between Stream Map spec v0.7 and the accepted Country renderer/interaction contract after #1220.

Spec/code/test state at closeout:

- choropleth remains primary;
- retired marker-first public copy is removed;
- retired marker-first validator assertion is removed;
- small-country fallback remains an aggregate Country fallback, not a creator-location point;
- Streams/Viewers and five log buckets remain intact;
- selection and camera controls remain separate;
- Country effective runtime order remains the #1218 order;
- City isolation remains intact in production smoke;
- no demo geography or inferred creator coordinate was introduced.

## Ongoing Country work allowed after closeout

Country may still receive:

- accessibility and keyboard fixes;
- mobile overflow/tap-target fixes;
- browser/regression repairs;
- evidence-quality maintenance under its separate reviewed-evidence policy;
- scoped correctness defects.

Those are maintenance/quality tasks. They do not reopen Country as the serial blocker for City, Kick or Current/IRL work.

## Next mainline gate

`Twitch City visualization / interaction specification`

The City specification must start from the existing City evidence/API/UI contract, not from the Country renderer. In particular it must preserve:

- Base City only from accepted `home_base` / `declared_location` evidence;
- country-only evidence is not promoted to City;
- Current/temporary evidence is not Base City;
- conflicts fail closed;
- login is not a stable identity;
- no creator address/GPS/precise coordinate publication;
- no Country centroid or invented coordinate as creator City position.
