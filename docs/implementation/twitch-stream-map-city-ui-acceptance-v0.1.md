# Twitch Stream Map City UI acceptance v0.1

The City UI gate is acceptable only when all of the following are true on the implementation PR:

- Country remains the default request and renders the existing Country contract.
- Selecting City adds only `geography=city` to the existing population query.
- The City response version is validated before rendering.
- City-placeable rows render by city; country-only rows and conflicts remain separately accounted.
- Current / IRL remains disabled.
- Population and evidence filters still operate independently of geography mode.
- No address, latitude, longitude, or GPS field is introduced.
- No stable Twitch user ID is claimed from the minute snapshot.
- Country drilldown regression, population filter regression, City contract tests, Web checks, and Web build are green.
- No production deploy or persistence mutation occurs as part of acceptance.
