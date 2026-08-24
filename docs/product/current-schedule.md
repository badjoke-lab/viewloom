# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-24

```text
Current program Twitch Stream Map
Current stage First bounded reviewed-evidence maintenance run closed invalid; next run must wait for accepted weekly cadence and use a fresh one-run authorization
Accepted main 8bcf787166d3c0f197262aecc7faea9cc1607f6e
Reviewed-evidence maintenance policy complete PR #994
Fresh review-cost measurement complete PR #1007
R3 reviewed evidence implementation complete PR #1009
Bounded maintenance proposal accepted Issue #1010 closed
Manual-dispatch implementation gate complete Issue #1012
Manual-dispatch harness merged PR #1013
Reservation/cadence guard correction merged PR #1016
First post-#1013 maintenance authorization Issue #1015 closed
First post-#1013 sample run 32647808047 completed
First post-#1013 finish run 32651990010 completed
First post-#1013 maintenance result INVALID for evidence mutation: search budget overflow
Search-budget fail-closed correction merged PR #1017
Post-#1013 maintenance runs 1 executed / 0 valid for new evidence mutation
Next reservation earliest 2026-08-30T15:12:18.093Z UTC / 2026-08-31T00:12:18.093+09:00
Automatic cron NOT authorized
City NOT authorized
Current Location / IRL NOT authorized
Kick Map NOT authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Current execution state

The repository contains an inert manual-dispatch maintenance harness. It does not run on a schedule, push or pull request.

One bounded post-#1013 maintenance run has now been executed under Issue #1015. Its acquisition and timing boundaries were valid, but the review itself exceeded the five-search-attempt ceiling for one sampled identity. The run is therefore retained for audit only and is **not authorized to mutate accepted reviewed evidence**.

Every future maintenance execution still requires a fresh open one-run authorization issue containing:

```text
viewloom-maintenance-authorization-v0.1
provider: twitch
topN: 20
oneRunOnly: true
automaticSchedule: false
```

The accepted manual envelope remains:

```text
provider                           Twitch only
population                         fixed overall Top 20
maintenance frequency              at most once per week
rolling 30-day maximum             4 reservations
execution                          manual workflow_dispatch only
app-token requests per run         <= 1
/helix/streams requests per run    <= 1
/helix/users requests              0
sample D1 writes                   0
sample production deploy           false
retained sample fields             rank/user ID/login/display name/viewers + run metadata
search rounds / identity           <= 5
review wall-clock ceiling          120 minutes
non-person refill                  none
geography preselection             none
```

Cadence is measured from durable structured reservation timestamps, not raw dispatch attempts. The first valid reservation was written at `2026-08-23T15:12:18.093Z`; therefore no later maintenance reservation may be created before `2026-08-30T15:12:18.093Z` under the accepted weekly envelope.

## First post-#1013 maintenance run closeout

Authorization:

```text
Issue #1015
```

Durable execution:

```text
reservation                   2026-08-23T15:12:18.093Z
sample run                    32647808047
sample observed               2026-08-23T15:12:32.244Z
reviewStartedAt               2026-08-23T15:12:34.017Z
finish run                    32651990010
reviewFinishedAt              2026-08-23T16:32:51.965Z
wall-clock review             80.29913333333333 minutes
```

Acquisition invariants:

```text
sample identities             20
sample viewers                539595
app-token requests            1
/helix/streams requests       1
/helix/users requests         0
D1 writes                     0
production Worker deploy      false
refill                         none
geography preselection        none
```

Observed review yield, retained only as an invalid-run audit result:

```text
reviewed identities                 20
accepted identities                  6
excluded non-person identities       5
person-eligible identities          15
eligible unmapped identities         9
country conflicts                    0
current-location acceptances         0
raw accepted coverage            30.00%
person-eligible accepted         40.00%
mapped viewer coverage       31.3981782633%
```

Invalidating finding:

```text
identity              indegnasen0706
recorded searchAttempts            6
allowed maximum                    5
wallClockValid                  true
reviewBudgetValid               false
evidenceMutationAuthorized      false
```

The overflow occurred because identity-resolution lookups were treated as separate from location/source lookups. PR #1017 now makes that interpretation explicitly invalid: identity resolution shares the same five-attempt budget; the counter increments before every distinct external lookup; reaching five without another terminal result ends as `no_qualifying_evidence`; a sixth attempt is forbidden. Any future `searchAttempts > 5` invalidates the run for evidence mutation.

No newly discovered country evidence from this invalid run was added to canonical reviewed evidence. Existing fresh accepted evidence remains unchanged.

## Maintenance run sequence

When the next maintenance review is eligible under the cadence guard:

1. create a fresh one-run authorization issue with the exact guard lines;
2. manually dispatch `.github/workflows/twitch-stream-map-reviewed-evidence-maintenance.yml` once;
3. let the workflow enforce the seven-day and rolling-30-day structured-reservation cadence guards;
4. let it durably write `viewloom-maintenance-run-reservation-v0.1` before Twitch access;
5. let it create only a non-production preview version from `tools/twitch-stream-map-reviewed-evidence-maintenance/`;
6. let it capture and validate exactly one fixed Top 20 sample;
7. let it durably write `viewloom-review-start-marker-v0.1` and exact UTC `reviewStartedAt`;
8. begin external/manual research only after that marker exists;
9. for each identity initialize `searchAttempts=0`, increment before every distinct external lookup including identity resolution, and never perform a sixth attempt;
10. at five attempts without another terminal result, record `no_qualifying_evidence` and stop that identity;
11. review all 20 identities under #994 with no refill;
12. after the twentieth terminal outcome, manually dispatch `.github/workflows/twitch-stream-map-reviewed-evidence-review-finish.yml`;
13. let the finish workflow write exact `reviewFinishedAt` and wall-clock minutes before enforcing the 120-minute ceiling;
14. retain the complete result; only a fully valid run may mutate accepted reviewed evidence in a normal reviewed PR;
15. accumulate valid manual operating history before proposing any automatic schedule.

## Production-deploy isolation

The maintenance preview Worker/config deliberately live outside:

```text
workers/collector-twitch/**
```

The final #1013 changed-file set contained only maintenance workflows, runbook/verifier and `tools/twitch-stream-map-reviewed-evidence-maintenance/**`. The existing `Deploy Collector Workers` workflow therefore is not selected by the merged maintenance tooling paths.

During #1013 review, an earlier draft temporarily used `workers/collector-twitch/**`; the PR-side deployment planner correctly skipped Twitch/Kick deploy, but the draft was moved before merge because a main-push path match could otherwise have caused a production collector deploy. The final merged tree contains no such maintenance file under the production collector directory.

## Durable timing and result rules

Required markers:

```text
viewloom-maintenance-run-reservation-v0.1
viewloom-review-start-marker-v0.1
viewloom-review-finish-marker-v0.1
```

`reviewStartedAt` and `reviewFinishedAt` must come from durable issue markers only. No reconstruction from chat, browser history or approximate GitHub activity is permitted.

Terminal outcomes remain:

```text
accepted
no_qualifying_evidence
excluded_nonperson
conflict_unmapped
```

Conflicting accepted countries remain unmapped unless explicit temporal supersession is manually reviewed.

For every terminal outcome, the retained result must include `searchAttempts`. Identity-resolution searches consume the same five-attempt budget as source/location searches. Any value greater than five makes `reviewBudgetValid=false` and blocks accepted-evidence mutation.

## Re-review lifecycle

For accepted `declared_location` / `home_base` evidence:

```text
age < 180 days, no contradiction     fresh; may remain without unnecessary source hunting
age >= 180 days                      due for bounded re-review
age >= 365 days without refresh      placement stops until refreshed
new explicit contradiction/change    immediate manual conflict/change review
```

Current Location / IRL remains blocked and is not governed by this lifecycle.

## R3 accepted baseline

The fresh independently clocked R3 Top 20 measurement remains the latest **valid accepted review baseline**:

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

PR #1009 retained the accepted R3 evidence:

```text
ramzes       RU / Moscow       declared_location  official_external
jasontheween US / Los Angeles  home_base           official_external
fps_shaka    JP / Tokyo        declared_location  official_external
```

and non-person classifications:

```text
lck           event_broadcast
lck_carry     organization
echo_esports  organization
```

Existing `eslcs = event_broadcast` remains unchanged. Existing `fps_shaka` Fukuoka birthplace evidence remains `context_only`.

## Country-only public boundary

Reviewed evidence may retain publicly declared city/region text internally, but public responses remain country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No address or coordinate collection is authorized. No maintenance run activates City.

## Authority that remains false

- automatic cron scheduling;
- execution above the weekly / rolling-30-day envelope;
- persistent external/social/panel crawler;
- automatic search-result/source acceptance;
- `/helix/users` expansion;
- City public fields;
- Current Location / IRL;
- Kick Map;
- Twitch/Kick geographic aggregation;
- collector cadence changes;
- D1 schema/binding changes;
- retention expansion;
- production mutation.

## Authoritative current records

- `docs/product/current-roadmap.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-review-cost-measurement-plan-v0.1.md`
- `docs/operations/twitch-stream-map-reviewed-evidence-maintenance-runbook-v0.1.md`
- `docs/operations/twitch-stream-map-reviewed-evidence-maintenance-run-32647808047-closeout-2026-08-23.md`
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
Issue #1010 bounded maintenance proposal / accepted and closed
Issue #1012 manual-dispatch implementation gate / complete
PR #1013 manual-dispatch maintenance harness / merged
PR #1016 reservation/cadence guard correction / merged
Issue #1015 first bounded maintenance authorization / consumed and closed
PR #1017 invalid-run closeout + search-budget fail-closed correction / merged
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
