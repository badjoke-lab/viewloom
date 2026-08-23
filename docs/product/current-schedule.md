# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-23

```text
Current program Twitch Stream Map
Current stage Bounded reviewed-evidence maintenance proposal review
Accepted main 400c93d31391aebe6e80682251d128410928459a
Reviewed-evidence maintenance policy complete PR #994
Fresh review-cost measurement complete PR #1007
R3 reviewed evidence implementation complete PR #1009
Current proposal Issue #1010 open
Recurring reviewed-evidence acquisition NOT authorized
Automatic cron NOT authorized
City NOT authorized
Current Location / IRL NOT authorized
Kick Map NOT authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Current decision

The fresh independently clocked R3 Top 20 review closed the only previously unproven review-cost threshold.

Accepted measured result:

```text
sample captured                    2026-08-23T09:22:22.534Z
sample identities                  20
sample viewers                886,296
reviewStartedAt                    2026-08-23T09:23:44.340Z
reviewFinishedAt                   2026-08-23T09:28:54.276Z
wall-clock review                   5.1656 minutes
accepted persons                    3
non-person exclusions               8
person-eligible identities         12
eligible unmapped                   9
raw accepted coverage           15.00%
person-eligible accepted        25.00%
mapped viewer coverage          5.83225%
minutes / accepted identity      1.72187
explicit attributable evidence      3/3
silent country conflicts             0
current-location acceptances          0
```

Frozen #994 gate:

```text
raw accepted country coverage >= 10%              PASS
person-eligible accepted coverage >= 15%           PASS
wall-clock review <= 120 minutes                   PASS
minutes per accepted identity <= 30               PASS
accepted evidence 100% explicit attributable       PASS
silent country conflicts == 0                     PASS
```

Therefore:

```text
measurementValid = true
recurringProposalGatePassed = true
```

This does **not** authorize recurring execution. It only opens the separately governed proposal stage in Issue #1010.

## Completed R3 implementation

PR #1009 is merged on main and applies the accepted R3 evidence:

```text
ramzes       RU / Moscow       declared_location  official_external
jasontheween US / Los Angeles  home_base           official_external
fps_shaka    JP / Tokyo        declared_location  official_external
```

It also classifies:

```text
lck           event_broadcast
lck_carry     organization
echo_esports  organization
```

Existing `eslcs = event_broadcast` remains unchanged. Existing `fps_shaka` Fukuoka birthplace evidence remains `context_only`.

The exact R3 regression proves:

```text
observed streams                 20
observed viewers            886,296
mapped persons                    3
mapped viewers               51,691
excluded non-person streams       8
excluded non-person viewers 434,968
eligible unmapped                 9
mapped countries          RU / US / JP
current-location streams          0
public city/region leakage        0
```

Historical #989/#995 audit metrics are evaluated against a pre-R3 evidence snapshot so the new evidence does not rewrite prior accepted measurements.

## Current order

1. Review Issue #1010 as a proposal only.
2. If accepted, create a separately bounded implementation gate.
3. Initial recurring implementation, if separately accepted, must be manual-dispatch only.
4. Prove one-run API/request ceilings and fail-closed timing before any recurring execution exists.
5. Preserve the existing 180-day re-review target and 365-day hard-stale rule for `declared_location` / `home_base`.
6. Preserve country-only public projection.
7. Do not arm automatic cron scheduling without a later explicit gate based on operating history.
8. City, Current Location/IRL and Kick Map remain blocked behind independent gates.

## Issue #1010 candidate envelope

Proposal only; execution authority remains false.

```text
provider                           Twitch only
population                         fixed overall Top 20
candidate frequency                at most once per week
rolling 30-day maximum             4 runs
initial execution                  manual dispatch only
app-token requests per run         <= 1
/helix/streams requests per run    <= 1
/helix/users requests              0
sample D1 writes                   0
sample production deploy           false
retained sample fields             rank/user ID/login/display name/viewers/timing only
search rounds / identity           <= 5
review wall-clock ceiling          120 minutes
non-person refill                  none
```

No automatic recurring acquisition follows merely from this proposal.

## Reviewed-evidence maintenance rules retained

Accepted source classes:

- self-controlled current statement;
- official affiliated source explicitly about the person;
- attributable editorial/interview source;
- reviewed transcript of a direct self-statement.

Rejected as standalone placement evidence:

- aggregator or unverified search snippet;
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

Staleness for `declared_location` / `home_base`:

```text
re-review target 180 days
hard stale        365 days
```

## Country-only public boundary

Reviewed evidence may retain publicly declared city/region text internally, but public responses remain country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No address or coordinate collection is authorized.

## Authoritative current records

- `docs/product/current-roadmap.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-review-cost-measurement-plan-v0.1.md`
- `docs/audits/twitch-stream-map-review-cost-measurement-contract-v0.1.json`
- `docs/audits/twitch-stream-map-review-cost-result-2026-08-23-r3.json`
- `docs/audits/twitch-stream-map-review-cost-measurement-2026-08-23-r3.md`
- `docs/audits/twitch-stream-map-top20-external-yield-2026-08-23.md`
- `docs/audits/twitch-stream-map-top20-replication-2026-08-23.md`

## Completed Stream Map anchors

```text
PR #964 source/yield audit
PR #965 bounded live probe
PR #966 title/tag candidate extraction
PR #971 entity/claim rules
PR #972 real live join
PR #974 public route + source/type filters
PR #977 country drilldown
PR #979 reason-aware Unmapped
PR #980 population-filter decision
PR #981 population filters
PR #983 ready-response semantics repair
PR #986 reviewed evidence remediation
PR #989 first fixed Top 20 sample verification-only / closed without merge
PR #990 first Top 20 reviewed evidence + country-only projection repair
PR #994 maintenance policy freeze
PR #995 second fixed Top 20 sample verification-only / closed without merge
PR #996 second Top 20 reviewed evidence + retained replication audit
PR #997 replication closeout docs
PR #1002 cost-measurement package
PR #1005 result harness
PR #1006 fresh R3 sample verification-only / closed without merge
PR #1007 measured R3 cost result
PR #1009 R3 reviewed evidence implementation
Issue #1010 bounded maintenance proposal / open
```

## Hard stops

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No tag-only acceptance.
- No candidate-only placement.
- No nationality/birthplace-as-home/current inference.
- No non-person channel placement as a person.
- No silent conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo fallback geography.
- No current-location claim from home/origin evidence.
- No City rollout from retained city records.
- No public region/city fields before a separately accepted City gate.
- No unsupported persistent external/social/panel crawler.
- No automatic search-result acceptance.
- No language UI until an accepted snapshot persistence contract retains language.
- No collector cadence, retention, D1 schema, binding or permanent acquisition change without a separate accepted gate.
- No automatic Kick Map rollout from Twitch acceptance.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

The following strings remain historical category-rollout verifier anchors and are not the current execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
