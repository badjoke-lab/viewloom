# ViewLoom Stream Map Current Execution Overlay v0.1

Status: current Stream Map execution override  
Applies to: Stream Map sections of `current-roadmap.md` and `current-schedule.md`  
Specification: `stream-map-spec-v0.6.md`  
Implementation plan: `stream-map-implementation-plan-v0.5.md`  
Last updated: 2026-08-29 UTC / revision d

## Purpose

This overlay is the current execution-order source for Stream Map. Historical maintenance records in `current-roadmap.md` and `current-schedule.md` remain valid history and verifier anchors, but their weekly fixed-Top-20 cadence does not control the development speed of the whole Map program.

Stream Map proceeds in parallel lanes. A CI wait, manual review wait, or production authorization boundary in one lane does not pause safe work in another lane.

## Current Map program

```text
Twitch Country
  public map                         DONE
  source/type filters               DONE
  country drilldown                 DONE
  unmapped reasons                  DONE
  population filters                DONE
  reviewed evidence                 LIVE
  Top300 review queue A-L           DONE
  canonical application             PARTIAL / PROD-DEPLOY-GATED

City
  evidence semantics                DONE
  retained-evidence audit           DONE
  live coverage gate                DONE
  explicit ?geography=city API      DONE
  public geography UI               DONE
  geography/filter orthogonality    DONE
  confidence/ambiguity contract     DONE (#1092)
  corroboration queue               DONE (#1095)
  corroboration review              DONE (#1096: 8 corroborated / 4 unresolved)
  Current/IRL mixing                DISABLED

Kick Country
  source audit                      DONE
  bounded official-source probe     DONE
  provider join/evidence contract   DONE
  Kick-only live-state core         DONE
  public readiness gate             DONE
  snapshot Country adapter          DONE
  Country response core             DONE
  provider/geography boundary CI    DONE (#1093)
  stable-ID collector persistence   DRAFT / PROD-DEPLOY-GATED (#1083)
  production Country API wiring     NOT YET
  public Country Map                NOT YET

Current Location / IRL
  freshness/TTL contract            DONE
  retained-evidence audit           DONE
  deterministic evaluator           DONE
  candidate coverage core           DONE
  bounded preview live probe        DONE
  identity-preserving review queue  DONE
  review batch contract             DONE (#1091)
  candidate review                  DONE (#1097)
  reviewed Current placements       0 / 10
  no-qualifying-evidence results    10 / 10
  current-location API layer        NOT YET
  public Current / IRL mode         NOT YET

Map control boundary
  Twitch public geography           Country + City
  Twitch default geography          Country
  Twitch Current / IRL UI           DISABLED
  Kick prepared geography           Country only
  Kick public activation            DISABLED
  Twitch/Kick aggregation           FORBIDDEN
  source filters activate geography NO
```

## Parallel lanes

```text
Lane A  Twitch Country canonical closeout + reviewed maintenance
Lane B  City evidence strengthening + ambiguity/confidence regression
Lane C  Kick stable-ID production gate + downstream Country wiring preparation
Lane D  Current / IRL evidence-yield follow-up + separate API/UI readiness
Lane E  Provider × Geography × Evidence Source / provenance integration
```

The weekly Top-20 reviewed-evidence workflow is only a bounded maintenance/re-review sublane. It does not pause the five lanes above.

## Lane A — Twitch Country

The one-shot Top300 recovery run produced 297 queued stable Twitch identities. Review batches A-L are complete.

Review and canonical application remain separate. Review completion does not authorize a production deploy.

Current production boundary:

- earlier canonical applications are retained on main;
- PR #1068 remains unmerged because it changes `apps/web/**`;
- a merge of that production surface can trigger production Web Pages deployment;
- #1068 and later production-surface canonical application work therefore remain behind explicit production authorization;
- this does not block City, Kick, Current/IRL, Map-control, docs, validator, fixture, or read-only work.

## Lane B — City

City is an active explicit geography mode. Country remains the default.

Base City rules remain:

- only accepted `home_base` / `declared_location` evidence can place Base City;
- Country never implies City;
- Current/temporary/event/travel evidence never mutates Base City;
- birthplace/context evidence never places Base City;
- conflicting accepted Base Country/City evidence fails closed;
- address, postal, coordinate, GPS or equivalent precise-location input fails the City privacy boundary.

PR #1092 added the City confidence / ambiguity classifier. `confidenceClass` means evidence consistency, not a probability estimate.

Retained-evidence baseline:

```text
reviewed entities                         28
City mapped                               12
  single explicit Base City              12
  consistent multiple Base City rows      0
Country-only at City resolution            4
Base City conflicts                        0
privacy-invalid rows                       0
```

PR #1095 converted the 12 single-explicit Base City mappings into a bounded corroboration queue. PR #1096 completed that review without changing canonical runtime evidence:

```text
reviewed corroboration entries            12
secondary Base City corroborated            8
no qualifying secondary evidence            4
secondary conflicts                         0
canonical mutation authorized           false
public activation authorized            false
```

Corroborated review candidates are `adinross`, `cinna`, `ddg`, `ibai`, `jasontheween`, `lacy`, `papaplatte`, and `ramzes`. `fps_shaka`, `knirpz`, `shotzzy`, and `xqc` remain valid under their existing single-explicit evidence but were not upgraded with weak/aggregator-only secondary material.

The #1096 review result is not canonical application. Applying additional reviewed City evidence would touch the production web evidence surface and therefore remains a separate production-gated step. City evidence-quality work can still continue through read-only corroboration, conflict detection, and regression tooling.

## Lane C — Kick

Merged safe preparation includes:

- official source audit and bounded real probe;
- stable identity contract: official Channels `broadcaster_user_id`;
- slug is lookup/display only and never stable identity;
- Kick-only Country live-state derivation;
- snapshot adapter;
- Country response core with mapped/unmapped/excluded/conflict reconciliation;
- `publicActivationAuthorized: false`;
- Twitch evidence reuse forbidden;
- provider aggregation forbidden;
- Country-to-City inference forbidden;
- Current-to-Base mutation forbidden.

PR #1093 additionally locks the public-control boundary: Twitch source options must not be copied into Kick before a provider-specific Kick evidence-source UI contract exists.

Production boundary:

- Draft PR #1083 changes the production Kick collector to persist official stable identity;
- it remains Draft and unmerged without production collector authorization;
- no D1/schema/cadence/retention change is authorized by this lane;
- after stable-ID persistence is separately authorized and proven, production API/web activation remains another gate.

## Lane D — Current Location / IRL

Current/IRL remains a separate temporal layer from Home/Base.

Hard rules:

- accepted Current placement requires attributable temporal evidence, provenance, `observedAt`, and `expiresAt`;
- expired evidence returns to Unknown;
- future/planned travel does not place early;
- overlapping contradictory fresh claims fail closed;
- Country/Home/Base never implies Current;
- Current never mutates Home/Base automatically;
- public precision is Country/City only; no address/GPS/precise route.

### Live measurement and review result

An earlier bounded candidate-availability probe found 11/300 candidate streams. That measurement established non-zero candidate yield only.

The later identity-preserving review-queue run `33182676137` is the current review source and measured:

```text
population                               300
reviewable candidates                     10
future/planned-travel rejected             3
candidate conflicts                        0
invalid identities                         0
Twitch token requests                      1
/helix/streams requests                    3
/helix/users requests                      0
D1 writes                                  0
production deployment                  false
raw title/tag/language retained         false
```

The frozen queue result is retained by #1090. PR #1091 turned the 10 identities into a bounded review batch. PR #1097 completed the read-only evidence review before the review window expired:

```text
candidateCount                            10
pendingReview                              0
acceptedCurrent                            0
noQualifyingEvidence                      10
expired                                    0
conflict                                   0
invalid                                    0
public Current placement authorized    false
base mutation authorized                false
```

The zero result is intentional rather than a missing review. Candidate stream title/tag evidence was not promoted into Current geography. Examples of rejected upgrade paths include planned-future travel, static profile/residence context without current-time meaning, language/nationality context, and location words that remained stream-title-only.

Therefore the current live candidate method has demonstrated candidate yield but has not yet demonstrated qualifying temporal Current evidence yield. Public Current API/UI remains disabled. The next safe Current/IRL work is to improve or remeasure reviewable temporal evidence acquisition without weakening the evidence contract or increasing public precision.

## Lane E — Provider / Geography / Evidence Source controls

PR #1093 locks the current control-state boundary without changing public runtime:

- Twitch public geography modes are `country` and `city`;
- Country remains the default;
- `current` is not a public Twitch geography mode and normalizes back to Country;
- Twitch evidence source/type filters remain orthogonal to geography activation;
- the existence of a `current_location` evidence-type filter does not activate Current/IRL UI;
- Kick is prepared only for Country and public activation remains false;
- Kick evidence-source controls are not publicly wired;
- source-filter state cannot activate a provider or geography;
- Twitch/Kick data aggregation remains forbidden.

The next UI work can build on this matrix without conflating provider, geography resolution, or evidence source.

## Shared hard boundaries

- no geography inference from language, timezone, name, category or IP;
- no nationality/birthplace-as-residence;
- no City inference from Country;
- no Current inference from Country or Home/Base;
- no non-person-as-person placement;
- no silent conflict resolution;
- no Twitch/Kick aggregation;
- no demo/pre-production geography presented as real;
- no precise residential address/GPS publication;
- no Current placement after TTL expiry;
- no automatic promotion of unreviewed geography;
- no collector/D1/schema/cadence/retention mutation without its own gate;
- no production deployment without required authorization.

## Immediate safe work

```text
A. keep #1068 behind explicit production Web Pages authorization
B. retain #1092/#1096 City evidence-quality gates; continue read-only corroboration/conflict work
C. keep #1083 Draft; continue production-independent Kick downstream preparation
D. treat #1097 as a completed zero-yield Current review and improve/reprobe temporal evidence acquisition without weakening acceptance rules
E. build provider/geography/source/provenance UI preparation on #1093 without public Kick/Current activation
```

## Historical maintenance records remain intact

The existing fixed-Top-20 maintenance workflow remains bounded by its own manual authorization, cadence, search-attempt and wall-clock ceilings. It remains a maintenance harness only and is not a global Stream Map schedule gate.

## Precedence

For current Stream Map execution order:

1. `stream-map-spec-v0.6.md`
2. `stream-map-implementation-plan-v0.5.md`
3. this execution overlay
4. older Stream Map scheduling statements in `current-roadmap.md`, `current-schedule.md`, `stream-map-spec-v0.5.md`, and `stream-map-implementation-plan-v0.4.md`

Historical measurements, audit findings, run IDs, maintenance ceilings and prior acceptance records in older files remain historical facts unless explicitly superseded here by a later measurement.
