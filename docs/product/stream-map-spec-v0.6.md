# ViewLoom Stream Map Specification v0.6

Status: current authoritative specification  
Platform scope: Twitch and Kick remain provider-separated  
Supersedes: `docs/product/stream-map-spec-v0.5.md`  
Implementation baseline: main `7f18f96dc2d42acaefa053a53adeb19c5195f07c`  
Last updated: 2026-08-28

## 1. Product role

Stream Map is ViewLoom's evidence-backed geographic observation view.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

Unknown, conflicting, candidate-only, stale and rejected geography remains unmapped.

## 2. Current implementation state

### Twitch Country Map

```text
public map                         DONE
source/type filters                DONE
country drilldown                  DONE
unmapped reasons                   DONE
population filters                 DONE
reviewed evidence                  LIVE
Top300 review queue A-L            DONE
canonical application              PARTIAL / PROD-DEPLOY-GATED
```

### City

```text
evidence semantics                 DONE
existing-evidence audit            DONE
live coverage decision             DONE
explicit ?geography=city API       DONE
public geography UI                DONE
Current / IRL use for base City    DISABLED
```

### Kick

```text
source audit                       DONE
bounded official-source probe      DONE
provider join/evidence contract    DONE
Country API                        NOT YET
Country Map                        NOT YET
```

### Current Location / IRL

```text
freshness/TTL contract             DONE
retained-evidence audit            DONE
deterministic freshness evaluator  DONE
accepted current/temporary rows    0 at last audit
live candidate coverage            NEXT / PARALLEL
public API/mode                     NOT YET
```

## 3. Program scheduling rule

Country, City, Kick, Current Location / IRL and Map UI are parallel product lanes.

The existing weekly Top-20 reviewed-evidence maintenance harness is a bounded safety/maintenance mechanism for its own workflow. It is **not** the global Stream Map development schedule. It must not block City/Kick/IRL/UI design, audit, fixtures, validation, preview-only probes or a separately accepted Country coverage-expansion gate.

No lane silently inherits another lane's production authority. Specification, read-only audit, fixtures and verification may proceed while production mutation/public exposure remains separately gated.

## 4. Provider separation

Twitch and Kick remain separate at every public geography layer.

- no Twitch/Kick geographic aggregation;
- no copying Twitch evidence into Kick records from name similarity;
- cross-provider identity reuse requires a separate identity-link contract;
- `/twitch/map/` and `/kick/map/` are independent data surfaces;
- provider-specific coverage, limitations and provenance remain visible;
- any provider switch/filter is a surface selection, not a mixed aggregation.

## 5. Evidence vocabulary

Evidence sources remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location claim kinds:

```text
birthplace
nationality
historical_residence
home_base
declared_location
temporary_location
current_location
event_venue
```

Only claims meeting the active layer's acceptance contract may place a stream.

A field being present does not make it canonical geography. Language is supplemental metadata only and never proves Country by itself.

## 6. Country placement

Country placement remains accepted-evidence-only.

Base-placement claims:

- `home_base`
- `declared_location`

A separately valid `current_location` may place only in the current-location layer once that layer is activated.

Never place from language, timezone, name cues, category, IP guesses, nationality alone, birthplace alone, organization/team headquarters, event venue alone, planned/future travel, or tag-only geography without accepted supporting evidence.

Conflicting accepted countries remain unmapped unless explicit temporal supersession is reviewed.

## 7. Country coverage expansion and canonical application

The one-shot Top300 recovery source run `32704826743` produced a stable-ID review queue of 297 identities split into batches A-L. All A-L review-result batches are complete as of 2026-08-28.

Review result and canonical application remain separate operations:

```text
review result
-> validator
-> canonical application PR
-> production-deploy boundary check
-> production read verification when authorized
```

A review result never mutates canonical evidence by itself.

The expansion process is bounded by actual work/cost, not a mandatory one-week idle interval. The accepted batch envelope remains max 25 identities per batch, max 5 external lookups per identity, max 100 lookups per batch, max 60 minutes per batch, and zero provider requests during manual review.

Canonical application is currently partial. PR #1068 remains unmerged because it changes `apps/web/**`, and the repository's `Deploy Web Pages` workflow performs a production Pages deployment on matching pushes to `main`. Production-deploy authorization is therefore a separate gate. That gate does not pause other safe Map work.

The existing weekly Top-20 harness remains valid as maintenance/re-review under its own frozen contract and is not the coverage-expansion scheduler.

## 8. City semantics and current contract

City is city-level grouping, not precise geolocation. Public City output must never expose residential addresses or exact coordinates.

Base City claims:

- accepted `home_base`
- accepted `declared_location`

Not valid for base City:

- `current_location`
- `temporary_location`
- birthplace
- nationality
- historical residence unless explicitly current
- event venue without proof of current presence
- planned/future travel

Examples:

```text
born in Osaka                  -> no City placement
Japanese streamer              -> no City placement
playing at an event in Paris   -> no home/base City placement
moving to Tokyo next month     -> no City placement
lives in Tokyo                 -> potential City base placement
currently streaming from Seoul -> Current Location candidate only
```

The City API is now implemented and activates only with explicit:

```text
/api/twitch-stream-map?geography=city
```

Default `/api/twitch-stream-map` behavior remains Country-oriented and compatibility-preserving.

City contract requirements:

- country-only rows stay explicit rather than being guessed into a City;
- multiple accepted base cities fail closed into a base City conflict;
- selected-population accounting reconciles exactly;
- address/latitude/longitude/GPS fields are not introduced;
- existing minute snapshots do not pretend login is a stable Twitch ID when stable ID is unavailable there.

The public geography UI is implemented for explicit Country/City selection. Current / IRL remains a separate disabled mode until its own evidence/API gate is ready.

Country confidence does not imply City confidence. City is never inferred from Country.

## 9. Kick source and evidence contract

Kick has progressed beyond source-audit planning.

Merged state includes:

- provider/collector source audit;
- bounded read-only official-source probe package;
- successful bounded real probe;
- provider join/evidence persistence contract and deterministic fixture.

Measured official request envelope:

```text
OAuth token            <= 1
Livestreams V2         <= 1
Channels               <= 10
legacy public fallback = 0
D1 writes              = 0
production deploy       = false
```

Provider identity/evidence rules:

- `channel.slug` from Livestreams V2 joins Channels `slug`;
- `broadcaster_user_id` is the stable Kick identity when present;
- slug/login is not a stable ID;
- `custom_tags` was absent in the measured run and must not be silently backfilled from the deprecated legacy path;
- raw title/tag/profile-description text is not retained without a separately accepted persistence contract;
- source classes remain provider-specific;
- automatic geography acceptance is prohibited;
- Twitch evidence is not copied automatically.

Next product target:

```text
Kick live population
-> Kick entity eligibility
-> Kick reviewed evidence
-> Kick Country placement
-> /api/kick-stream-map
-> /kick/map/
```

Twitch and Kick coverage remain independent.

## 10. Current Location / IRL contract and evaluator

Current Location is separate from home/base.

```text
Home/Base      Los Angeles
Current        Tokyo
Observed at    <timestamp>
Expires at     <timestamp>
```

Implemented semantics:

- accepted current/temporary claims require source/provenance, country, `observedAt` and `expiresAt`;
- fresh claims can place only the Current layer;
- expired claims return to Unknown instead of sticking;
- future claims do not place before their valid window;
- missing expiry fails closed;
- overlapping fresh contradictory claims become `conflicting_current_location` and remain unmapped;
- current/temporary evidence never mutates home/base automatically;
- public precision is Country/City only; no address, GPS trace, precise coordinates, hotel/private venue detail.

The retained-evidence audit found zero accepted `current_location` and zero accepted `temporary_location` rows at the time of #1051. Therefore the public Current / IRL layer is not ready merely because the evaluator exists.

Next safe gate is a read-only live candidate coverage measurement. A separate current-location API and public mode may follow only if the evidence gate supports them.

## 11. Map UI contract

The UI must support both an all-sources view and source-specific inspection without collapsing provenance.

Current Twitch implementation already includes:

- evidence-source multi-select;
- location-type multi-select;
- distinct evidence-source badges/colors;
- country drilldown;
- explicit unmapped/excluded accounting;
- provenance/source links;
- explicit Country/City geography mode.

Required continuing behavior:

- provider selection/switching must keep Twitch and Kick data separated;
- Country and City filters/resolutions are explicit and independent;
- Home/Base and Current Location are separate displays/modes;
- source classes can be combined or filtered individually;
- evidence strength/provenance remains inspectable;
- candidate-only source presence never appears as canonical placement;
- language alone never places geography;
- conflicts remain visibly unmapped;
- excluded non-person rows are explicit and never placed as people.

Kick-facing Map controls must wait for a real Kick Country API rather than demo geography.

## 12. Existing public Twitch population/filter contract

Current Twitch public pipeline remains:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> geography layer
-> entity/evidence placement gate
-> evidence source/type filters
-> geography drilldown
```

Current population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     not a placement control
```

Population filters are complete and are no longer the next product gate.

## 13. Hard invariants

- no language/category-to-geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-current/base inference;
- no City inference from Country;
- no Current Location inference from Country or Home/Base;
- no non-person-as-person placement;
- no silent accepted-country/city/current conflict resolution;
- no Twitch/Kick geographic aggregation;
- no demo geography presented as real;
- no unsupported persistent crawler merely to inflate coverage;
- no precise residential address/GPS publication;
- no current-location claim from home/origin evidence;
- no current-location placement after TTL expiry;
- collector cadence, retention, D1 schema/binding and permanent acquisition changes remain separately gated;
- production deployment requires its own authorization when the repository workflow would deploy on merge.

## 14. Next execution lanes

```text
Lane A  Twitch Country canonical closeout under production-deploy boundary
Lane B  City evidence quality / ambiguity / UI contract refinement
Lane C  Kick Country live join/API then Kick Map
Lane D  Current Location / IRL live-candidate coverage then separate API/UI gate
Lane E  provider/geography/evidence-source Map UI refinement without aggregation
```

Public API/UI changes occur only after the corresponding lane's evidence and verification gate is accepted. No lane waits for the weekly Top20 maintenance clock before doing otherwise-safe work.
