# Twitch Stream Map reviewed-evidence review-cost measurement R3 — 2026-08-23

Status: measured; recurring-maintenance proposal gate passed  
Provider: Twitch only  
Public geography: country only  
Production mutation: none

## Acquisition

Verification-only PR: #1006 (closed without merge)  
Sample artifact: `9490976914`  
Captured: `2026-08-23T09:22:22.534Z`  
Hard not-before: `2026-08-23T08:28:43.300Z`

Acquisition remained inside the accepted boundary:

```text
sample identities        20
sample viewers      886,296
token requests            1
/helix/streams             1
/helix/users               0
D1 writes                  0
production deploy         no
```

Only rank, Twitch user ID, login, display name and viewers were retained. Title, tags, language, profile description, category and geography were not retained by the sample artifact.

Overlap:

```text
with #989 fixed sample    4 / 20
with #995 fixed sample    8 / 20
```

## Durable review clock

The exact start marker was committed remotely before the first external/manual research action.

```text
reviewStartedAt   2026-08-23T09:23:44.340Z
reviewFinishedAt  2026-08-23T09:28:54.276Z
wall clock        5.1656 minutes
```

Failed/rejected source paths remained inside the measured wall clock. Review search rounds were bounded to at most five per identity.

## Result

```text
reviewed identities                         20
accepted placeable persons                   3
excluded non-person identities               8
person-eligible identities                  12
eligible persons without accepted evidence   9
accepted country conflicts                   0
accepted current-location records            0
explicit attributable accepted evidence    3/3
source official_external                     3
source manual_review                          0
```

Accepted reviewed evidence:

### `ramzes`

```text
country      RU / Russia
city         Moscow (retained evidence only)
claim kind   declared_location
source       official_external
source URL   https://x.com/ramzes/with_replies
```

The current self-controlled X profile declares `Москва, Россия`. The recent Monaco discussion was explicitly hypothetical and therefore does not create a competing accepted residence claim.

### `jasontheween`

```text
country      US / United States
city         Los Angeles (retained evidence only)
claim kind   home_base
source       official_external
source URL   https://www.bloomberg.com/news/articles/2026-02-10/jasontheween-parlays-goofy-antics-into-3-million-a-year-job
```

The attributable current editorial source explicitly states that he lives in the Los Angeles mansion occupied by the creator group.

### `fps_shaka`

```text
country      JP / Japan
city         Tokyo (retained evidence only)
claim kind   declared_location
source       official_external
source URL   https://x.com/avashaka/with_replies
```

The current self-controlled X profile identifies SHAKA, links `twitch.tv/fps_shaka`, and declares `日本 東京`. The previously retained Fukuoka birthplace record remains context-only and is not used as residence evidence.

Non-person rows:

```text
dota2ti       event_broadcast
dota2ti_ru    event_broadcast
ow_esports    event_broadcast
lck           event_broadcast
lck_carry     organization
otplol_        organization
echo_esports  organization
eslcs         organization
```

## Derived metrics

```text
raw accepted coverage                 3 / 20 = 15.00%
person-eligible accepted coverage     3 / 12 = 25.00%
mapped viewers                        51,691
mapped viewer coverage                         5.83225%
minutes per reviewed identity                  0.25828
minutes per accepted identity                  1.72187
silent country conflicts                       0
```

## Frozen #994 gate

```text
raw accepted country coverage >= 10%              PASS
person-eligible accepted coverage >= 15%           PASS
wall-clock review <= 120 minutes                   PASS
minutes per accepted identity <= 30               PASS
accepted evidence 100% explicit attributable       PASS
silent country conflicts == 0                     PASS
```

`measurementValid = true`  
`recurringProposalGatePassed = true`

Passing this gate authorizes only a separate bounded recurring-maintenance proposal. It does not authorize recurring acquisition by itself, a persistent crawler, automatic search acceptance, City, Current Location/IRL, Kick Map, collector cadence changes, D1 schema/binding changes, retention expansion or production mutation.

## Evidence rejected during review

Notable rejected patterns remained rejected exactly as the frozen policy requires:

- Nix: Spain material explicitly described temporary wintering/rental rather than durable residence/base;
- Caedrel: Berlin office/team presence did not establish residence;
- Kato Junichi: clips/mirrors did not provide a directly inspectable qualifying residence/base source;
- TheBurntPeanut: current self-controlled profiles did not disclose a qualifying base;
- HoangLuanBLV: aggregator/biographical location claims only;
- just_ns: aggregator country claims rejected and current self-controlled material lacked a residence claim;
- Futon-chan: self-controlled activity confirmed identity but not residence; mirrors rejected;
- Solo: older residence material was beyond freshness;
- Lazvell: origin/event references were not converted to residence.

The full 20-row result, search-round counts, timing, thresholds and authority flags are retained in `docs/audits/twitch-stream-map-review-cost-result-2026-08-23-r3.json` and are checked by a dedicated evaluator-backed CI verifier.
