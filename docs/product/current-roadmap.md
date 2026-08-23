# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone state

**Twitch Stream Map — reviewed-evidence cost gate passed; bounded maintenance proposal pending.**

Current accepted implementation baseline:

```text
main 400c93d31391aebe6e80682251d128410928459a
```

Current governance:

```text
Reviewed-evidence maintenance policy   complete / PR #994
Fresh review-cost measurement          complete / PR #1007
R3 reviewed evidence implementation    complete / PR #1009
Recurring-maintenance proposal         Issue #1010 open
Recurring acquisition                  NOT authorized
Automatic cron                         NOT authorized
Persistent crawler                     NOT authorized
Automatic search acceptance            NOT authorized
City                                   NOT authorized
Current Location / IRL                 NOT authorized
Kick Map                               NOT authorized
Collector/D1/cadence/retention change  NOT authorized
Production mutation                    NOT authorized
```

## What the R3 gate established

Verification-only acquisition #1006 captured one fresh Twitch Top 20 after the accepted six-hour not-before boundary. The sample retained only rank, Twitch user ID, login, display name, viewers and timing/request metadata.

The independently clocked review result was retained by #1007:

```text
sampleCapturedAt                         2026-08-23T09:22:22.534Z
sample identities                        20
sample viewers                      886,296
reviewStartedAt                          2026-08-23T09:23:44.340Z
reviewFinishedAt                         2026-08-23T09:28:54.276Z
wall-clock review                         5.1656 minutes
accepted placeable persons                3
excluded non-person identities            8
person-eligible identities               12
eligible unmapped identities              9
raw accepted coverage                 15.00%
person-eligible accepted coverage     25.00%
mapped viewer coverage                5.83225%
minutes per accepted identity          1.72187
explicit attributable accepted         3 / 3
silent country conflicts                   0
current-location acceptances                0
```

Frozen #994 threshold result:

```text
raw accepted country coverage >= 10%              PASS
person-eligible accepted coverage >= 15%           PASS
wall-clock review <= 120 minutes                   PASS
minutes per accepted identity <= 30               PASS
accepted evidence 100% explicit attributable       PASS
silent country conflicts == 0                     PASS
```

`measurementValid = true` and `recurringProposalGatePassed = true`.

This result authorizes only consideration of a separate bounded recurring-maintenance proposal. It does not itself authorize recurring execution.

## R3 evidence now implemented

PR #1009 added the accepted R3 evidence to the current reviewed-evidence registry and preserved the earlier audit populations through an explicit pre-R3 evidence snapshot.

Accepted R3 person records:

```text
ramzes       RU / Russia          Moscow retained internally       declared_location  official_external
jasontheween US / United States   Los Angeles retained internally home_base           official_external
fps_shaka    JP / Japan           Tokyo retained internally       declared_location  official_external
```

New non-person classifications:

```text
lck           event_broadcast
lck_carry     organization
echo_esports  organization
```

Existing `eslcs = event_broadcast` remains unchanged.

The existing Fukuoka birthplace evidence for `fps_shaka` remains `context_only`; it is not converted into residence evidence.

## Current next gate — Issue #1010

Issue #1010 is a proposal only. It does not create or arm a recurring workflow.

Candidate operating envelope:

```text
provider                           Twitch only
population                         one fixed current overall Top 20
candidate cadence                  at most weekly
rolling 30-day maximum             4 runs
initial execution mode             manual dispatch only
sample token requests              <= 1
/helix/streams requests            <= 1
/helix/users requests              0
sample D1 writes                   0
sample production deploy           false
search rounds per identity         <= 5
wall-clock review ceiling          120 minutes
non-person refill                  none
```

Before any recurring acquisition exists, a separately accepted implementation gate must prove the request ceilings, fail-closed timing, manual-dispatch-only default, rollback/disable path, country-only projection and all existing hard stops.

## Current public behavior

Population order:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side placement
-> evidence source/type filters
-> country drilldown
```

Public controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred
```

Evidence source classes remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Placement claim kinds remain distinct:

```text
home_base
declared_location
current_location
```

Placement remains accepted-evidence-only. Language, timezone, name, category and IP never create geography. Nationality and birthplace do not become residence/base. Organization/event channels are not placed as people. Twitch and Kick remain separate.

## Country-only public boundary

Reviewed evidence may retain explicitly public city/region text internally for future separately gated decisions, but the public Twitch Map remains country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

PR #1009 exact regressions prove the R3 sample maps only RU / US / JP, keeps eight non-person rows excluded, retains nine eligible-unmapped rows, returns zero Current Location, and does not leak retained Moscow / Los Angeles / Tokyo city values publicly.

## Reviewed-evidence maintenance policy retained

Accepted source classes:

- self-controlled current statement;
- official affiliated source explicitly about the person;
- attributable editorial/interview source;
- reviewed transcript of a direct self-statement.

Rejected as standalone placement evidence:

- aggregators or unverified search snippets;
- nationality or birthplace;
- language, timezone, category, name cue or IP;
- organization/team headquarters;
- event venue;
- temporary or planned travel;
- tag-only geography;
- home/origin converted into current-location evidence.

Conflict rule:

```text
conflicting accepted countries
-> unmapped unless explicit temporal supersession is manually reviewed
```

Staleness for `declared_location` and `home_base`:

```text
re-review target 180 days
hard stale        365 days
```

Current Location / IRL remains a separate blocked stage.

## Authoritative Stream Map records

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-top20-replication-plan-v0.1.md`
- `docs/product/stream-map-review-cost-measurement-plan-v0.1.md`
- `docs/audits/twitch-stream-map-review-cost-measurement-contract-v0.1.json`
- `docs/audits/twitch-stream-map-review-cost-result-2026-08-23-r3.json`
- `docs/audits/twitch-stream-map-review-cost-measurement-2026-08-23-r3.md`
- `docs/audits/twitch-stream-map-population-coverage-2026-08-23.md`
- `docs/audits/twitch-stream-map-coverage-remediation-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-replication-2026-08-23.md`

## Completed Stream Map execution anchors

```text
PR #964 source/yield audit
PR #965 bounded live probe
PR #966 title/tag candidate extraction
PR #970 temporary acquisition verification-only / closed without merge
PR #971 entity/claim rules
PR #972 real live join
PR #974 public route + source/type filters
PR #975 production route/API verification-only / closed without merge
PR #977 country drilldown
PR #979 reason-aware Unmapped
PR #980 population-filter decision
PR #981 population filters
PR #983 ready-response semantics repair
PR #982 population coverage verification-only / closed without merge
PR #985 remediation candidate audit verification-only / closed without merge
PR #986 reviewed evidence remediation
PR #987 production verification-only / closed without merge
PR #989 first fixed Top 20 sample verification-only / closed without merge
PR #990 first Top 20 reviewed evidence + country-only projection repair
PR #994 maintenance policy freeze
PR #995 second fixed Top 20 sample verification-only / closed without merge
PR #996 second Top 20 reviewed evidence + retained replication audit
PR #997 replication closeout docs
PR #1002 review-cost measurement package
PR #1005 review-cost result harness
PR #1006 fresh R3 sample verification-only / closed without merge
PR #1007 measured R3 cost result
PR #1009 R3 reviewed evidence implementation
Issue #1010 bounded recurring-maintenance proposal / open
```

## Stream Map hard boundaries

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No nationality/birthplace-as-current/home inference.
- No organization/event-broadcast-as-person placement.
- No silent accepted-country conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo geography substituted for failed real data.
- No current-location claim from home/origin evidence.
- No City rollout from retained city evidence.
- No public region/city response before a separate City gate.
- No unsupported persistent external/social/panel crawler.
- No automatic search-result acceptance.
- No language population UI until an accepted retained-data contract supports it.
- No D1/schema/cadence/retention/permanent-acquisition change without a separate accepted gate.
- No automatic Kick Map rollout from Twitch acceptance.

## Later gates — each requires separate acceptance

1. Bounded recurring reviewed-evidence maintenance implementation, only if Issue #1010 is explicitly accepted.
2. City evidence/spec gate, only if accepted city coverage is broad enough to justify it.
3. Current Location freshness/expiry gate, only if explicit current-location evidence becomes useful.
4. IRL-oriented view gate, only after useful Current Location coverage exists.
5. Separate Kick source audit and implementation gate.
6. Location history/replay gate, only after live location semantics remain stable.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
