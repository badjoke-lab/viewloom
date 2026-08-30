# ViewLoom Stream Map Current Execution Overlay v0.1

Status: current Stream Map execution override  
Applies to: Stream Map sections of `current-roadmap.md` and `current-schedule.md`  
Specification: `stream-map-spec-v0.6.md`  
Implementation plan: `stream-map-implementation-plan-v0.5.md`  
Last updated: 2026-08-29 UTC / revision g

## Purpose

This file is the current execution-order source for Stream Map. Historical maintenance records remain valid history and verifier anchors, but the weekly fixed-Top-20 maintenance cadence does not control the development speed of the whole Map program.

Country, City, Kick, Current Location / IRL and Map UI remain parallel lanes. A CI wait, manual-review wait, zero-yield evidence result, or production-authorization boundary in one lane does not pause safe work in the others.

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
  canonical application             PARTIAL / PROD-DEPLOY-GATED (#1068)

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
  snapshot source contract          DONE (#1100)
  stable-ID collector persistence   DRAFT / PROD-DEPLOY-GATED (#1083)
  production Country API wiring     NOT YET
  public Country Map                NOT YET

Current Location / IRL
  freshness/TTL contract            DONE
  retained-evidence audit           DONE
  deterministic evaluator           DONE
  candidate coverage / live probe   DONE
  identity-preserving review queue  DONE
  candidate review                  DONE (#1097)
  temporal evidence contract CI     DONE (#1099)
  reviewability taxonomy alignment  DONE (#1101)
  accepted-class acquisition queue  DONE (#1103)
  Current response core             DONE (#1104)
  accepted-class research result    DONE (#1106: fresh 0 / promoted 0)
  future snapshot source contract   DONE (#1108)
  stable-ID collector persistence   DRAFT / PROD-DEPLOY-GATED (#1107)
  reviewed fresh Current evidence   0
  public current-location API route DISABLED / NOT YET
  public Current / IRL mode         DISABLED / NOT YET

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
Lane C  Kick stable-ID production gate + downstream Country activation preparation
Lane D  Current stable-ID production gate + fresh evidence yield + API/UI readiness
Lane E  Provider × Geography × Evidence Source / provenance integration
```

The weekly Top-20 reviewed-evidence workflow is a bounded maintenance/re-review sublane only. It does not pause these lanes.

## Lane A — Twitch Country

The Top300 recovery review batches A-L are complete. Review and canonical application remain separate.

PR #1068 remains unmerged because it changes the production Web Pages surface. That production authorization boundary does not block City, Kick, Current/IRL, fixtures, validators, read-only research, or non-deploying UI contract work.

## Lane B — City

City is an active explicit geography mode; Country remains default.

Hard City rules remain:

- only accepted `home_base` / `declared_location` evidence can place Base City;
- Country never implies City;
- Current/temporary/event/travel evidence never mutates Base City;
- birthplace/context evidence never places Base City;
- conflicting accepted Base City evidence fails closed;
- no address/GPS/coordinate publication.

PR #1096 reviewed all 12 single-explicit Base City mappings: 8 received secondary corroboration, 4 remained unresolved, and 0 conflicts were found. That result is review-only; additional canonical application remains production-gated.

## Lane C — Kick

Safe preparation already merged includes official-source probing, stable-identity semantics, Kick-only live-state derivation, snapshot adapter, Country response core, provider/geography boundary CI, and the production-independent snapshot source contract from #1100.

Stable Kick identity remains official Channels `broadcaster_user_id`. Slug is lookup/display metadata only. Twitch evidence reuse, provider aggregation, Country-to-City inference and Current-to-Base mutation remain forbidden.

Draft #1083 is the production collector persistence gate. It remains unmerged. Production Country API wiring and public Kick Map activation remain later gates.

## Lane D — Current Location / IRL

Current remains a separate temporal layer from Home/Base.

### Evidence contract

The accepted evidence classes are exactly:

```text
self_controlled_current_statement
official_affiliated_current_statement
attributable_editorial_current_statement
reviewed_direct_self_statement_transcript
```

Candidate-only stream title/tag, static profile/base context without current-time meaning, search snippets and unrelated reposts cannot place Current. Planned future travel, nationality, birthplace, language, timezone, IP inference, name cues, organization headquarters, event venue without presence, old residence statements and category/game signals remain standalone-rejected.

Accepted Current evidence must be attributable and temporal. Open-ended accepted Current evidence defaults to a 24-hour TTL. Expired evidence returns to Unknown. Contradictory fresh claims fail closed. Current never mutates Home/Base. Public precision remains Country/City only.

### Completed candidate review

PR #1097 completed the 10-entry Current review batch:

```text
candidateCount                            10
acceptedCurrent                            0
noQualifyingEvidence                      10
conflict                                   0
invalid                                    0
```

Candidate title/tag evidence was not promoted.

### Accepted-class acquisition and real result

PR #1103 converted those 10 identities into a deterministic four-class research plan: 10 identities × 4 accepted classes = 40 identity/class tasks, with zero Twitch provider requests and no automatic acceptance.

PR #1106 records the actual read-only result:

```text
identities reviewed                       10
identity × accepted-class pairs           40
fresh qualifying evidence                  0
promoted to Current review                 0
accepted Current placement                 0
provider requests                          0
```

The result deliberately does not claim a mechanically audited external-search request count. Supplemental browser verification was performed, but `externalSearchRequestCountMechanicallyAudited` and `lookupBudgetComplianceClaimed` remain false rather than inventing request accounting.

Notable fail-closed outcomes remain:

- RayAsianBoy: attributable US editorial evidence was outside the Current 24-hour freshness window and did not support the Taiwan candidate;
- Berticuss: Germany remained stream-title metadata only;
- DeadlySlob: Canadian profile context remained static/base context;
- Jinnytty: self-controlled schedule material was stale or future-plan context rather than fresh Current presence.

Zero yield is a completed evidence result, not permission to weaken the contract.

### Current response and source cores

PR #1104 adds the production-independent Current response core. It requires stable `twitchUserId`; missing stable identity becomes `stable_identity_unavailable`, and login is never used as a fallback.

The response core handles fresh, expired, future, candidate-only, no-evidence, missing-ID and conflicting-fresh states. Multiple fresh accepted evidence rows may produce one Current placement only when they agree on the same Country/City. Raw title/tag/language, source URLs and precise-location fields do not enter the response. `publicActivationAuthorized` remains false.

PR #1108 adds the production-independent future snapshot source contract outside the production web deploy surface. It accepts only retained snapshot `twitchUserId`, rejects raw `user_id` or login as a stable-ID substitute, strips raw stream metadata, and verifies snapshot-source -> #1104 response-core behavior end to end. Its final merged diff contains no `apps/web/**` and no collector changes.

### Twitch stable-ID production gate

The real collector audit found that `/helix/streams` already supplies Twitch `user_id`, but the production collector currently discards it before snapshot persistence.

Draft #1107 prepares the minimal persistence change:

```text
collector source diff before gate files   1 file / +4 / -0
additional Twitch API requests             0
/helix/users requests                      0
schema change                              no
cadence change                             no
retention change                           no
production deploy                          no
```

#1107 PR CI is green: collector typecheck, stable-ID persistence verifier and Current public-readiness gate all pass. The Deploy Collector Workers PR workflow also passed its verify/plan jobs while `deploy-twitch`, `deploy-kick` and remote-schema verification were skipped. #1107 remains Draft and must not be merged without production collector authorization.

Current public readiness therefore remains intentionally false:

```text
Current response core                     ready in code
future stable-ID snapshot source core     ready in code
production collector stable ID            ready in Draft only
public route stable-ID consumption        blocked
fresh reviewed Current evidence           blocked (0)
public Current activation                 false
```

The next safe Current work is readiness/UI contract preparation that does not expose Current publicly, plus future fresh-evidence reprobes when meaningful. Production collector persistence requires its own authorization.

## Lane E — Provider / Geography / Evidence Source controls

Provider, geography and evidence-source controls remain orthogonal:

- Twitch public geography: Country + City;
- `current` is not a public geography mode;
- evidence filters never activate a geography;
- Kick remains Country-only in prepared contracts and publicly disabled;
- Twitch source controls are not copied into Kick;
- Twitch/Kick aggregation remains forbidden.

Safe UI/provenance preparation may continue without public Kick/Current activation.

## Shared hard boundaries

- no language/timezone/name/category/IP-to-geography inference;
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
- no login-as-stable-ID substitution;
- no collector/D1/schema/cadence/retention mutation without its own gate;
- no production deployment without required authorization.

## Immediate safe work

```text
A. keep #1068 behind explicit production Web Pages authorization
B. continue City read-only corroboration/conflict regression without mutating canonical evidence
C. keep Kick #1083 Draft; continue only production-independent downstream/public-readiness preparation
D. keep Twitch #1107 Draft; continue Current readiness/UI contract work without public activation and re-check fresh evidence when there is meaningful new material
E. continue provider/geography/source/provenance UI preparation without aggregation
```

## Historical maintenance records remain intact

The existing fixed-Top-20 maintenance workflow remains bounded by its own manual authorization, cadence, search-attempt and wall-clock ceilings. It remains maintenance only and is not a global Stream Map schedule gate.

## Precedence

For current Stream Map execution order:

1. `stream-map-spec-v0.6.md`
2. `stream-map-implementation-plan-v0.5.md`
3. this execution overlay
4. older Stream Map scheduling statements in `current-roadmap.md`, `current-schedule.md`, `stream-map-spec-v0.5.md`, and `stream-map-implementation-plan-v0.4.md`

Historical measurements, run IDs, audit findings and prior acceptance records in older files remain historical facts unless explicitly superseded here.
