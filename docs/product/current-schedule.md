# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-23

```text
Current program Twitch Stream Map
Current stage Second fixed Top 20 replication closed; recurring acquisition not authorized
Accepted main 940840e08daea498361eaa0486b9a211aa280f90
Reviewed-evidence maintenance policy complete PR #994
Second fixed Top 20 sample complete PR #995 verification-only / close without merge
Second fixed Top 20 reviewed evidence + retained audit complete PR #996
Twitch Map public route /twitch/map/
Twitch Map real API /api/twitch-stream-map
Kick Map not authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Current decision

The reviewed-evidence maintenance policy was frozen before the second sample in PR #994. Verification-only PR #995 captured the second current Twitch Top 20 at `2026-08-23T02:28:43.300Z`, 32,433 seconds after the first #989 sample, satisfying the precommitted six-hour separation requirement.

PR #996 retained the second review result on main:

```text
sample identities                         20
sample viewers                       480,179
sample overlap with #989                   2
sample overlap percent                 10.00%
accepted placeable persons                  5
excluded non-person identities              4
person-eligible identities                 16
eligible persons without acceptance        11
accepted country conflicts                  0
accepted current-location records           0
official_external accepted                  2
manual_review accepted                       3
mapped viewers                          83,553
raw accepted coverage                   25.00%
person-eligible accepted coverage       31.25%
mapped viewer coverage                  17.4004%
```

Accepted second-sample records:

```text
adinross  US / United States  official_external  home_base
xqc       US / United States  manual_review      declared_location
lacy      US / United States  manual_review      home_base
cinna     US / United States  manual_review      declared_location
ddg       US / United States  official_external  home_base
```

`dota2ti_es` was additionally classified as `event_broadcast`. Existing `dota2ti`, `dota2ti_ru` and `ow_esports` non-person classifications remain active.

## Frozen recurring-maintenance gate result

The precommitted thresholds are evaluated separately:

```text
raw accepted country coverage             >= 10%   PASS  25.00%
person-eligible accepted country coverage >= 15%   PASS  31.25%
wall-clock review time                     <= 120m  UNPROVEN
minutes per accepted identity              <= 30m   UNPROVEN
accepted evidence quality                  100%     PASS  5/5 explicit attributable
silent country conflicts                   0        PASS  0
```

The prior review thread began research without durably retaining the exact `reviewStartedAt` required by the accepted policy. No replacement timestamp was invented. Therefore review wall-clock minutes and minutes per accepted identity are unproven.

**Overall recurring-maintenance proposal gate: NOT PASSED / NOT AUTHORIZED.**

Useful replicated evidence yield does not substitute for the missing cost measurement. No recurring acquisition, persistent external crawler or automatic search-result acceptance follows from this result.

## Current order

The policy + two-sample replication milestone is closed. There is no automatic transition to a new geographic stage.

1. Keep the existing reviewed evidence curated under the accepted staleness rules.
2. Preserve honest Unmapped coverage when no accepted evidence exists.
3. Preserve the country-only public projection.
4. Do not retroactively repair or estimate the missing #995 review-start timestamp.
5. If recurring reviewed-evidence maintenance is reconsidered, require a new separately accepted and independently clocked bounded cost measurement.
6. City, Current Location/IRL and Kick Map remain blocked until separate specifications/gates are accepted.
7. No collector cadence, D1 schema, retention, binding or permanent acquisition change is implied by this closeout.

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
-> unmapped unless explicit temporal supersession is reviewed
```

Staleness for `declared_location` and `home_base`:

```text
re-review target 180 days
hard stale        365 days
```

## Country-only public boundary

Reviewed evidence may retain explicitly public region/city values internally for future gated decisions. The public Twitch Map remains country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

No address or coordinate collection is authorized.

## Authoritative retained audits

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
PR #985 coverage-remediation candidate audit verification-only / closed without merge
PR #986 reviewed evidence remediation
PR #987 production verification-only / closed without merge
PR #989 first fixed Top 20 sample verification-only / closed without merge
PR #990 first Top 20 reviewed evidence + country-only projection repair
PR #994 maintenance policy freeze
PR #995 second fixed Top 20 sample verification-only / close without merge
PR #996 second Top 20 reviewed evidence + retained replication audit
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

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and are not rewritten by Stream Map closeout.

The following strings remain historical category-rollout verifier anchors and are not the current execution schedule:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
