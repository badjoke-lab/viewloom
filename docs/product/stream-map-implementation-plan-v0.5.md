# ViewLoom Stream Map Implementation Plan v0.5

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.6.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.4.md`  
Baseline: main `e93ad2b6b752d23c482ecdb23cb7903dcefecb1f`  
Last updated: 2026-08-28

## 1. Current position

Completed Twitch Country surface:

1. source inventory/audit — #964
2. read-only live evidence probe — #965
3. title/tag candidate extraction — #966
4. entity/claim eligibility + retained evidence — #971
5. real latest-snapshot live join — #972
6. public MapLibre route + evidence source/type filters — #974
7. country selection/drilldown — #977
8. reason-aware Unmapped analysis — #979
9. population-filter decision — #980
10. population filters — #981
11. ready-response semantics repair — #983
12. reviewed evidence remediation/replication/cost gates — #986/#990/#996/#1007/#1009
13. bounded manual maintenance harness — #1013/#1016/#1017
14. Top300 stable-ID recovery + A-L review queue — #1037/#1039/#1042/#1048
15. Country review results A-L — complete through #1074

Country review execution is complete for the current 297-identity recovery queue. Canonical application is separate and only partially complete. PR #1068 remains blocked from merge by the production Pages deployment boundary, not by validator failure.

Parallel lanes have also advanced:

- City retained-evidence audit and live gate — #1035/#1042
- explicit City API — #1049
- public City geography UI — #1061
- City geography/filter orthogonality regression gate — #1078
- Kick source audit — #1034
- Kick bounded official probe and real trigger — #1050/#1056
- Kick provider join/evidence persistence contract — #1059
- Kick Country live-state core — #1076
- Kick public-readiness gate — #1081
- Kick snapshot Country adapter — #1084
- Kick Country response core — #1085
- Current Location / IRL contract — #1038
- Current Location retained-evidence audit + deterministic freshness evaluator — #1051
- Current / IRL candidate coverage core — #1077
- Current / IRL bounded preview probe package/trigger — #1079/#1080
- Current / IRL live candidate audit — #1082

## 2. Execution model

Map development is parallel, not one serial queue.

```text
Lane A  Twitch Country canonical closeout + future evidence maintenance
Lane B  City evidence quality / ambiguity / UI refinement
Lane C  Kick Country production persistence/API wiring + Map
Lane D  Current Location / IRL reviewed-candidate gate + separate API/UI
Lane E  Map UI provider/geography/source refinement
```

The weekly Top-20 maintenance harness is a maintenance sublane only. Its cadence does not pause B/C/D/E and does not define Lane A's review-batch cadence.

## 3. Lane A — Twitch Country

### A1. Current Top300 review gate — DONE

Source run:

```text
32704826743
```

Retained queue:

- 297 stable Twitch identities;
- 12 deterministic batches A-L;
- max 25 identities per batch; final L = 22;
- max 5 external lookups per identity;
- max 100 external lookups per batch;
- max 60 minutes per batch;
- provider requests = 0 during manual review;
- no weekly wait condition.

All A-L review-result batches are complete.

### A2. Canonical application — PARTIAL / SEPARATE

Canonical application must remain separate from review execution:

```text
merged review result
-> result validator
-> canonical module/apply artifact
-> canonical validator
-> production-deploy boundary check
-> merge only with required authority
-> production read verification if applicable
```

A-D canonical applications are already retained. #1068 is the next open application PR and remains unmerged because it changes `apps/web/**`; a main merge would match the existing production `Deploy Web Pages` workflow.

Do not weaken the validator or bypass the production boundary merely to close the Country queue.

### A3. While production authorization is absent

Continue safe work:

- result/canonical validator improvements;
- read-only audits;
- fixture validation;
- future reviewed-evidence maintenance preparation;
- City/Kick/IRL/UI/docs work.

Do not turn production authorization waiting into a Map-wide idle state.

## 4. Lane B — City

### B1. Semantics and evidence audit — DONE

Base City placement uses only accepted:

```text
home_base
declared_location
```

Do not use for base City:

```text
current_location
temporary_location
birthplace
nationality
event_venue
planned travel
historical residence not explicitly current
```

The retained-evidence audit established City-bearing accepted base rows, explicit context-only rows, no precise-location keys and fail-closed conflict handling.

### B2. Live coverage decision — DONE

The shared Top300 acquisition was reused for City live-coverage measurement without a second Twitch acquisition. Population reconciliation, conflict and privacy gates were explicit.

### B3. City API — DONE

City is opt-in only:

```text
/api/twitch-stream-map?geography=city
```

Requirements already implemented:

- default route remains Country behavior;
- country-only rows remain explicit;
- no City inference from Country;
- base City conflicts fail closed;
- no address/latitude/longitude/GPS fields;
- current/temporary evidence does not place base City;
- stable Twitch ID unavailability in the permanent minute snapshot is reported honestly.

### B4. Public City geography UI — DONE

The public Twitch Map can explicitly request City geography. Country remains the default. Current / IRL remains disabled and separate.

### B5. Geography/filter orthogonality regression — DONE

#1078 proves geography selection does not silently rewrite population, evidence-source or evidence-type filter state. It also locks country-only-at-city-resolution and base-City-conflict accounting while Current / IRL remains outside the base City contract.

### B6. Next City work

Proceed independently of Country canonical authorization:

- improve City ambiguity/confidence explanation;
- exercise mobile/desktop UI and zero/conflict states;
- retain explicit country-only-at-city-resolution accounting;
- reuse newly reviewed evidence only when it contains independently valid City evidence; never derive City from accepted Country alone.

## 5. Lane C — Kick Country

### C1. Source audit — DONE

The actual collector/provider path has been audited.

### C2. Bounded official probe — DONE

Historical measured probe ceiling:

```text
OAuth token            <= 1
Livestreams V2         <= 1
Channels               <= 10
legacy public fallback = 0
D1 writes              = 0
production deploy       = false
```

No raw title/tag/profile-description body retention is authorized by the probe.

### C3. Provider join/evidence contract — DONE

Frozen join:

```text
Livestreams V2 channel.slug
-> Channels slug
-> broadcaster_user_id as stable identity when present
```

Slug/login is not treated as stable ID. Twitch evidence is not copied automatically. Missing or ambiguous stable identity fails closed.

### C4. Kick-only live-state / snapshot adapter / response model — DONE

Merged safe layers:

```text
#1076 Kick-only live Country state core
#1084 persisted-snapshot -> Country state adapter
#1085 Country response core
```

The response model:

- preserves provider = `kick`;
- exposes mapped / unmapped / excluded / conflict terminal states;
- reconciles selected stream and viewer populations;
- uses `broadcaster_user_id` as stable identity;
- never treats slug as stable ID;
- never reuses Twitch evidence;
- publishes no raw title/profile/tag body and no precise location;
- keeps `publicActivationAuthorized: false`.

### C5. Stable-ID collector persistence — DRAFT / PROD-DEPLOY-GATED

Draft PR #1083 prepares production collector enrichment:

```text
Livestreams Top100
-> normalized unique slugs
-> official Channels lookup batches of <= 50 slugs
-> at most 2 Channels identity requests for Top100
-> retain broadcaster_user_id only when the normalized slug join is unique
```

#1083 collector checks, staged readiness gate and dedicated stable-ID persistence CI are green after aligning the workflow install mode with the repository's no-lockfile setup.

Do not merge #1083 without the required production collector deployment authorization. No schema, cadence or retention change is part of this implementation.

### C6. Later: production Kick Country API wiring

Target remains:

```text
/api/kick-stream-map
```

Production wiring must consume the retained stable identity and merged response semantics. It must not activate from slug-only snapshots.

### C7. Later: Kick Map

Target:

```text
/kick/map/
```

Reuse UI components only where semantics are provider-independent. Do not fill missing Kick sources from Twitch or deprecated fallback paths. Twitch/Kick geography is never aggregated.

## 6. Lane D — Current Location / IRL

### D1. Freshness/TTL contract — DONE

Accepted current/temporary claims require provenance plus:

```text
country
observedAt
expiresAt
```

### D2. Retained-evidence audit — DONE

The #1051 audit found:

```text
accepted current_location rows   0
accepted temporary_location rows 0
```

Therefore public Current / IRL is not ready from retained evidence alone.

### D3. Deterministic freshness evaluator — DONE

Evaluator proves:

- fresh current/temporary claims place only Current;
- expiry returns to Unknown;
- future claims do not place early;
- missing expiry fails closed;
- overlapping contradictory fresh claims become `conflicting_current_location`;
- no automatic base/home mutation.

### D4. Read-only live candidate coverage — DONE

Merged path:

```text
#1077 candidate coverage measurement core
#1079 preview-only bounded live probe
#1080 one-time reviewed trigger
#1082 aggregate-only retained audit
```

Measured run `33144962164`:

```text
population                       300
candidate streams                11
candidate coverage               3.67%
title candidates                 2
tag candidates                   9
future/travel titles rejected    5
country candidates               11
city candidates                  1
Twitch token requests            1
/helix/streams requests          3
/helix/users requests            0
D1 writes                        0
production deployment            false
raw title/tag/language retention false
```

This proves candidate availability only. It does not accept Current geography.

### D5. Next: reviewed-candidate reviewability / acceptance gate

The next safe step must define how a candidate can be reviewed without turning raw live text into an uncontrolled durable corpus.

Requirements:

- identity/provenance must be sufficient to review the candidate;
- accepted Current claims still require `observedAt` and `expiresAt`;
- future/travel cues remain reject-only;
- language remains non-placement metadata;
- no automatic acceptance from title/tag/profile extraction;
- no Home/Base mutation;
- no address/GPS/precise coordinates;
- raw retention, if any is proposed at all, requires a separate bounded retention/privacy gate before implementation.

### D6. Later: separate current-location API layer

Only after useful reviewed evidence exists. Expired rows must disappear from Current placement.

### D7. Later: Current / IRL UI mode

Current is not base City. UI must label Home/Base and Current separately and never imply inferred travel paths.

## 7. Lane E — Map UI

### E1. Already implemented on Twitch

- evidence-source multi-select;
- location-type multi-select;
- distinct source badges/colors;
- country drilldown;
- reason-aware Unmapped/excluded display;
- evidence provenance/source links;
- explicit Country/City geography mode;
- geography/filter orthogonality regression coverage.

### E2. Next safe refinements

- keep an all-sources view and source-specific filters simultaneously available;
- clarify evidence strength/provenance in the UI;
- preserve source colors across geography modes;
- make Country/City selection state and evidence-source state independent;
- surface country-only-at-city-resolution and base City conflicts clearly;
- prepare provider selector/switching UI that selects a provider surface without aggregating Twitch/Kick;
- reserve a separately labeled Home/Base vs Current mode model before Current activation;
- keep unmapped and excluded states explicit on mobile as well as desktop.

Language can be displayed as metadata when available but cannot become a geography-placement filter or proof by itself.

## 8. Maintenance sublane

Existing #1013/#1016/#1017 weekly Top-20 reviewed-evidence maintenance remains valid under its own frozen envelope:

```text
manual dispatch
separate one-run authorization
Top 20
weekly maximum
no automatic schedule
```

This sublane is not the main product schedule and does not block Lane A/B/C/D/E work.

## 9. Immediate branch/issue order

Work continues in parallel:

```text
A. keep #1068 and later canonical application behind explicit production Web Pages authorization
B. City ambiguity/confidence + UI regression work
C. keep #1083 Draft; prepare downstream Kick API wiring without public activation
D. Current/IRL reviewed-candidate reviewability/acceptance gate
E. Map UI provider/geography/source/provenance refinement
```

Recommended order inside each safe lane:

```text
spec/contract
-> read-only audit or deterministic fixture
-> verification
-> implementation gate
-> API/data changes if needed
-> public UI
-> production read verification when authorized/appropriate
```

CI waiting in one lane is not a reason to stop safe work in another lane.

## 10. Shared hard stops

- no geography inference from language/timezone/name/category/IP;
- no nationality/birthplace-as-residence;
- no City inference from Country;
- no Current Location inference from Country or Home/Base;
- no non-person-as-person placement;
- no silent conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography;
- no precise residential address/GPS publication;
- no unsupported crawler solely for coverage inflation;
- no current location surviving TTL expiry;
- no collector/D1/cadence/retention mutation without its own accepted gate;
- no production deploy without required authorization.

## 11. Definition of Map completion path

The Map program does not wait for perfect Country coverage before other lanes progress.

Completion path:

```text
Twitch Country usable + canonical review/apply lifecycle maintained
AND City contract/UI remains evidence-safe and useful
AND Kick Country independently live
AND Current/IRL contract + layer live if reviewed evidence supports it
AND provider/geography/source UI remains explicit and non-aggregating
THEN geography History/Replay can expand
```

Country coverage remains an ongoing quality program rather than a serial blocker for every later Map capability.
