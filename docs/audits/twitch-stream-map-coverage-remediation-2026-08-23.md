# Twitch Stream Map coverage remediation audit — 2026-08-23

Status: accepted bounded remediation evidence  
Provider: Twitch only  
Production mutation during audits: none

## Purpose

The preceding production population audit showed zero mapped streams across Top 20/50/100/300, viewer-threshold and major-category scopes. This remediation gate tested whether supported Twitch sources plus bounded manual review could add accepted geographic evidence without weakening placement rules.

No language/category/name/timezone/IP inference was allowed. Twitch geographic tags remained candidate-only. No persistent Twitch panel/social crawler was introduced.

## Stage A — supported-source candidate audit

Verification-only PR: `#985`  
Workflow: `Twitch Stream Map Coverage Remediation Audit`  
Workflow run: `32583840691`  
Successful job: `97057120474`  
Artifact: `9478499570`  
Workflow head: `3004a7c417a07aea1c333a6267a0b6931b408bb0`  
Audit mode: non-production Cloudflare Worker version preview

Read-only request cost:

```text
token requests          1
/helix/streams requests 3
/helix/users requests   3
D1 writes               0
production deploy       no
```

Observed sample:

```text
streams                            300
unique users returned              300
profile descriptions present       280
profile candidates                   0
strong-title candidates              0
tag candidates                       3
all-source candidates                 3
unknown streams                     297
current-location candidates           0
home/base candidates                  0
declared-country candidates           0
ambiguous candidates                  3
same-claim multi-location conflicts   1
already-reviewed candidates           0
incremental candidates                 3
```

Candidate logins:

```text
wirtual   tag candidates: Norway + Sweden; ambiguous same-claim conflict
payo      tag candidate: Canada; ambiguous
knirpz    tag candidate: Berlin -> Germany; ambiguous
```

The audit automatically accepted zero records. Tags were used only to identify a bounded manual-review set.

## Stage B — bounded manual review

Three candidate streamers were reviewed individually. Accepted placement evidence came from independently attributable explicit external sources, not from the triggering Twitch tags.

### `payo`

Accepted record:

```text
source       official_external
source URL   https://x.com/payowow/with_replies
country      CA / Canada
claim kind   declared_location
confidence   explicit
status       accepted
```

Review basis: the streamer's external profile identifies the Twitch channel and explicitly declares Canada.

### `wirtual`

Accepted record:

```text
source       official_external
source URL   https://www.redbull.com/int-en/events/red-bull-faster/red-bull-faster-faq
country      NO / Norway
claim kind   declared_location
confidence   explicit
status       accepted
```

Review basis: Red Bull's official Red Bull Faster FAQ identifies Wirtual, states that Wirtual is from Norway, and points to Wirtual's Twitch/YouTube channels.

The Twitch tags `Norway` + `Sweden` remain ambiguous candidate-only evidence. Sweden was not rejected by tag interpretation and Norway was not selected from the tag conflict. The accepted Norway record is supported independently by the explicit external source.

### `knirpz`

Accepted record:

```text
source       official_external
source URL   https://x.com/knirpz
country      DE / Germany
region       Berlin
city         Berlin
claim kind   declared_location
confidence   explicit
status       accepted
```

Review basis: the streamer's external profile identifies the Twitch channel and explicitly declares Berlin, Germany.

The city/region values are retained only in reviewed evidence for a later City gate. The current live Map remains country-level and does not expose a Berlin placement.

## Stage C — reviewed-evidence implementation

Implementation PR: `#986`  
Merged main: `b0a99f480ec4f2320af09aa0329b044f8eeee3eb`

Changed files only:

- `apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs`
- `apps/web/scripts/verify-twitch-stream-map-live-join.mjs`

Implementation boundaries:

- added the three `official_external` accepted records above;
- did not persist or accept the Twitch tag candidates;
- did not add a current-location claim;
- did not change placement eligibility;
- did not expose city placement;
- did not change collector, D1, cadence, retention or acquisition runtime.

Final Web checks run for #986: `32586829849`, job `97064373300`, success.

The final run passed:

- Typecheck;
- Build;
- Twitch Stream Map live join;
- source filters;
- country drilldown;
- reason-aware Unmapped;
- population filters;
- all existing Heatmap regression gates.

The verifier proves the three reviewed records map through `official_external`; it separately proves Knirpz's Berlin value remains in reviewed evidence while the current live model output remains country-level.

## Same-sample impact

All three #985 candidates were live in the 300-stream audit sample. If the three reviewed acceptances are applied to that same sample, the maximum direct improvement attributable to this bounded candidate lane is:

```text
accepted incremental streamers  3
sample streams                  300
same-sample mapped coverage     1.00%
```

This is a retrospective same-sample calculation, not a production observation after deployment.

## Stage D — production verification after #986

Verification-only PR: `#987`  
Workflow: `Twitch Stream Map Reviewed Evidence Production Audit`  
Successful workflow run: `32587130892`  
Successful job: `97065114836`  
Artifact: `9479337312`  
Workflow head: `9c09b120006b9c57b7936652c0e6b3b70056769c`  
Observed production snapshot: `2026-08-22T17:10:17.378Z`

The workflow performed read-only GET requests against the production Stream Map API. It did not deploy production or mutate storage.

Production result:

```text
observed streams          300
observed viewers          1,508,683
mapped streams              2
unmapped streams          298
mapped stream percent       0.006667  = 0.6667%
mapped viewers             12,402
mapped viewer percent       0.00822   = 0.8220%
mapped countries             2
current-location streams     0
excluded non-person streams  2
no-reviewed-evidence       296
```

Mapped records:

```text
wirtual  9,816 viewers  NO / Norway  source=official_external  type=declared_location
payo     2,586 viewers  CA / Canada  source=official_external  type=declared_location
```

`knirpz` was not present as a live mapped row in that production snapshot. This is a live-population fact, not a rejection of the retained reviewed evidence.

For the two live remediation targets:

- source remained `official_external`;
- current-location remained false/zero;
- `regions` and `cities` in the public model remained empty;
- no city value was exposed from the retained Knirpz evidence.

The production result therefore verifies that #986 is active and that the accepted evidence increases real mapped coverage without changing country-level/current-location boundaries.

## Decision

This remediation method is valid but not yet sufficient as a map-coverage strategy.

Positive result:

- 3/3 bounded candidate reviews produced independently supported accepted `official_external` records;
- two of those records overlapped the immediate production Top 300 and mapped correctly;
- no inference rule or unsupported crawler was needed.

Coverage limitation:

- candidate discovery from current Twitch profile/title/tag surfaces found only 3 candidates in 300 streams;
- even perfect acceptance of all three yields only 1.00% on the #985 sample;
- the immediate production snapshot mapped 2/300 = 0.6667%;
- current-location yield remained zero.

Therefore:

1. do not weaken evidence eligibility;
2. do not accept tag-only geography;
3. do not proceed to City/Current/IRL merely because one retained record contains a city;
4. do not introduce a persistent unsupported external crawler;
5. run one separate bounded fixed-population `official_external` / `manual_review` yield experiment that is **not dependent on Twitch geographic tag/title/profile candidates**.

## Next bounded experiment

Use a fixed current Top 20 sample obtained read-only from the supported Twitch stream surface. Review each sampled streamer only for attributable explicit self/official external location evidence.

Report separately:

```text
sample size
reviewed identities
explicit accepted country records
explicit accepted city records
current-location records
no-explicit-location records
review minutes / manual burden
source type
source overlap
conflicts
resulting same-sample mapped percentage
```

This experiment is a measurement only. It does not authorize automated external crawling or a permanent acquisition pipeline.

Decision after the Top 20 experiment:

- if explicit attributable external evidence materially raises coverage at acceptable bounded review cost, design a separately gated acquisition/update model;
- if it remains sparse or operationally expensive, keep the Map low-coverage and prioritize honest Unmapped/inspection value instead of weakening placement rules.

## Hard boundaries retained

- No language/timezone/name/category/IP geography inference.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No non-person-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No current-location claim from home/origin evidence.
- No City rollout from one retained city record.
- No unsupported persistent social/panel crawler.
- No collector cadence, retention or D1 change from this remediation gate.
