# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-23

## Current milestone state

**Twitch Stream Map — bounded reviewed-evidence maintenance harness installed; no maintenance run executed yet.**

Current accepted implementation baseline:

```text
main c52c7d69bf7c062645797bef10348f7d93adcf14
```

Current governance:

```text
Reviewed-evidence maintenance policy     complete / PR #994
Fresh review-cost measurement            complete / PR #1007
R3 reviewed evidence implementation      complete / PR #1009
Bounded maintenance proposal             accepted / Issue #1010 closed
Manual-dispatch implementation gate      complete / Issue #1012
Manual-dispatch harness                   merged / PR #1013
Post-#1013 maintenance runs               0
Each actual run                           requires separate one-run authorization issue
Automatic cron                            NOT authorized
Persistent crawler                       NOT authorized
Automatic search acceptance              NOT authorized
City                                     NOT authorized
Current Location / IRL                   NOT authorized
Kick Map                                 NOT authorized
Collector/D1/cadence/retention change    NOT authorized
Production mutation                      NOT authorized
```

The accepted maintenance authority is intentionally narrow: one explicitly authorized manual run at a time under the frozen envelope. Installing the harness did not itself acquire a sample or research any identity.

## Manual maintenance harness now on main — #1013

PR #1013 installs an inert manual-dispatch harness:

- acquisition trigger is `workflow_dispatch` only;
- no `schedule`, push, pull-request, repository-dispatch or webhook trigger exists on the acquisition workflow;
- every run requires a separate open one-run authorization issue;
- the issue is reserved before any Twitch API request so it cannot be replayed;
- prior maintenance dispatch within seven days blocks a new dispatch;
- four prior dispatches in the rolling 30-day window block a new dispatch;
- one app-token request maximum;
- one `/helix/streams?first=20` request maximum;
- zero `/helix/users` requests;
- zero D1 writes;
- no production Worker deploy;
- no non-person refill;
- no geography preselection;
- exactly 20 fixed identities;
- retained sample fields are only rank, Twitch user ID, login, display name and viewers plus run metadata;
- title, tags, language, profile description, category, geography, coordinates and address are forbidden in the sample artifact;
- `reviewStartedAt` is durably posted before research;
- `reviewFinishedAt` is durably posted after all 20 terminal outcomes;
- maximum five search rounds per reviewed identity;
- 120-minute review ceiling;
- country-only public projection remains regression-tested.

The preview Worker/config live under:

```text
tools/twitch-stream-map-reviewed-evidence-maintenance/
```

They deliberately do **not** live under `workers/collector-twitch/**`. This avoids triggering the existing production Collector Worker deployment workflow when the maintenance harness itself changes. The #1013 final diff contained no production collector path, and the PR-side deployment planner skipped both Twitch and Kick deployment.

## One-run authorization contract

Every actual maintenance run requires a new open issue containing these exact lines:

```text
viewloom-maintenance-authorization-v0.1
provider: twitch
topN: 20
oneRunOnly: true
automaticSchedule: false
```

The acquisition workflow writes a durable reservation before Twitch access:

```text
viewloom-maintenance-run-reservation-v0.1
```

After sample validation it writes:

```text
viewloom-review-start-marker-v0.1
```

Only then may external/manual research begin. After all 20 terminal outcomes, the separate finish workflow writes:

```text
viewloom-review-finish-marker-v0.1
```

Timing may not be reconstructed from chat, browser history or approximate activity timestamps.

No one-run authorization issue has been created for a post-#1013 maintenance execution yet, and no maintenance sample has been acquired through the new harness.

## Accepted operating envelope

```text
provider                           Twitch only
population                         one fixed current overall Top 20
maintenance frequency              at most once per week
rolling 30-day maximum             4 dispatches
execution mode                     manual dispatch only
sample token requests              <= 1
/helix/streams requests            <= 1
/helix/users requests              0
sample D1 writes                   0
sample production deploy           false
search rounds per identity         <= 5
wall-clock review ceiling          120 minutes
non-person refill                  none
geography preselection             none
```

Automatic cron scheduling remains a later, separately gated decision and requires operating history. It is not implied by #1013.

## What the R3 gate established

Verification-only acquisition #1006 captured the fresh R3 Twitch Top 20 after the accepted six-hour not-before boundary. The independently clocked result retained by #1007 was:

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

`measurementValid = true` and `recurringProposalGatePassed = true`. That measurement enabled the bounded proposal and manual implementation; it did not authorize automatic scheduling.

## R3 evidence implemented

PR #1009 retained:

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

Existing `eslcs = event_broadcast` remains unchanged. The existing Fukuoka birthplace evidence for `fps_shaka` remains `context_only` and is not converted into residence evidence.

Historical #989/#995 audit metrics are evaluated against an explicit pre-R3 evidence snapshot so later accepted evidence does not rewrite earlier measurements.

## Reviewed-evidence lifecycle

For accepted `declared_location` / `home_base` evidence:

```text
age < 180 days, no contradiction     fresh; unnecessary source hunting may be skipped
age >= 180 days                      due for bounded re-review
age >= 365 days without refresh      placement stops until refreshed
new explicit contradiction/change    immediate manual conflict/change review
```

Current Location is not covered by this lifecycle and remains blocked.

Accepted source classes remain:

- self-controlled current statement;
- official affiliated source explicitly about the person;
- attributable editorial/interview source;
- reviewed transcript of a direct self-statement.

Rejected as standalone placement evidence remain:

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

Reviewed evidence may retain explicitly public city/region text internally for future separately gated decisions, but public Twitch Map responses remain country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No maintenance run, retained city value or review result activates City.

## Current next execution stage

When a maintenance review is actually due:

1. create one dedicated authorization issue with the exact guard tokens;
2. manually dispatch the acquisition workflow once;
3. allow the workflow to reserve the issue, capture the fixed Top 20, validate the artifact and persist `reviewStartedAt`;
4. begin research only after the durable start marker exists;
5. review all 20 identities under #994, max five search rounds each, with no refill;
6. manually dispatch the finish workflow after the twentieth terminal outcome;
7. retain the full result and accepted evidence in normal reviewed PRs;
8. evaluate operating history before any automatic-schedule proposal.

There is no reason to immediately repeat the just-completed R3 review merely because the harness exists. The harness is available for the next separately authorized maintenance interval; it is not a background job.

## Authoritative Stream Map records

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/product/stream-map-top20-replication-plan-v0.1.md`
- `docs/product/stream-map-review-cost-measurement-plan-v0.1.md`
- `docs/operations/twitch-stream-map-reviewed-evidence-maintenance-runbook-v0.1.md`
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
Issue #1010 bounded recurring-maintenance proposal / accepted and closed
Issue #1012 manual-dispatch implementation gate / complete
PR #1013 manual-dispatch maintenance harness / merged
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

1. First and subsequent bounded manual maintenance runs: each requires a fresh one-run authorization issue.
2. Automatic schedule gate: only after sufficient manual operating history and a separate acceptance.
3. City evidence/spec gate: only if accepted city coverage is broad enough to justify it.
4. Current Location freshness/expiry gate: only if explicit current-location evidence becomes useful.
5. IRL-oriented view gate: only after useful Current Location coverage exists.
6. Separate Kick source audit and implementation gate.
7. Location history/replay gate: only after live location semantics remain stable.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
