# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-23

```text
Current program Twitch Stream Map
Current stage Manual reviewed-evidence maintenance harness installed; next run requires separate one-run authorization
Accepted main c52c7d69bf7c062645797bef10348f7d93adcf14
Reviewed-evidence maintenance policy complete PR #994
Fresh review-cost measurement complete PR #1007
R3 reviewed evidence implementation complete PR #1009
Bounded maintenance proposal accepted Issue #1010 closed
Manual-dispatch implementation gate complete Issue #1012
Manual-dispatch harness merged PR #1013
Post-#1013 maintenance runs 0
Automatic cron NOT authorized
City NOT authorized
Current Location / IRL NOT authorized
Kick Map NOT authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Current execution state

The repository now contains an inert manual-dispatch maintenance harness. It does not run on a schedule, push or pull request and it did not execute a Twitch maintenance sample when merged.

Every actual maintenance execution requires a fresh open one-run authorization issue containing:

```text
viewloom-maintenance-authorization-v0.1
provider: twitch
topN: 20
oneRunOnly: true
automaticSchedule: false
```

The accepted manual envelope is:

```text
provider                           Twitch only
population                         fixed overall Top 20
maintenance frequency              at most once per week
rolling 30-day maximum             4 dispatches
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

The workflow reserves the one-run issue before any Twitch API request. A reserved issue cannot be replayed. The sample endpoint is called exactly once and has no automatic retry.

## Maintenance run sequence

When a maintenance review is due:

1. create a fresh one-run authorization issue with the exact guard lines;
2. manually dispatch `.github/workflows/twitch-stream-map-reviewed-evidence-maintenance.yml` once;
3. let the workflow enforce the seven-day and rolling-30-day cadence guards;
4. let it durably write `viewloom-maintenance-run-reservation-v0.1` before Twitch access;
5. let it create only a non-production preview version from `tools/twitch-stream-map-reviewed-evidence-maintenance/`;
6. let it capture and validate exactly one fixed Top 20 sample;
7. let it durably write `viewloom-review-start-marker-v0.1` and exact UTC `reviewStartedAt`;
8. begin external/manual research only after that marker exists;
9. review all 20 identities under #994 with no refill and max five search rounds per identity;
10. after the twentieth terminal outcome, manually dispatch `.github/workflows/twitch-stream-map-reviewed-evidence-review-finish.yml`;
11. let the finish workflow write exact `reviewFinishedAt` and wall-clock minutes before enforcing the 120-minute ceiling;
12. retain the complete result and accepted evidence in normal reviewed PRs;
13. accumulate manual operating history before proposing any automatic schedule.

No post-#1013 run has been authorized or executed yet. The just-completed R3 review should not be duplicated immediately merely because the harness now exists.

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

The fresh independently clocked R3 Top 20 measurement remains the latest completed review baseline:

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
