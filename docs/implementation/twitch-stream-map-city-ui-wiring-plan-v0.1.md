# Twitch Stream Map City UI wiring plan v0.1

Issue: #1060

The branch already freezes Country/City request semantics in a pure core and CI. The remaining wiring on this same branch is intentionally narrow:

1. add a Geography control to `/twitch/map/` with Country default and City explicit;
2. keep Current / IRL disabled and visibly unavailable;
3. pass the selected mode through the geography request core;
4. accept only `viewloom-stream-map-live-v1` for Country and `viewloom-stream-map-city-contract-v0.1` for City;
5. render City-placeable rows by city and separately account `countryOnlyStreams` and `baseCityConflicts`;
6. preserve population/evidence filters and reset only geography-dependent drilldown state when mode changes;
7. retain API identity disclosure (`stableTwitchUserIdAvailableInMinuteSnapshot: false`);
8. add browser/static regression coverage before merge.

No production deployment or persistence changes are part of this wiring plan.
