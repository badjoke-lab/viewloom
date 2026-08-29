# Twitch Stream Map renderer bundle repair — 2026-08-30

Status: implementation candidate

Observed public failure:

- real Twitch Stream Map data loaded successfully;
- mapped stream/country lists were populated;
- the World map canvas remained blank;
- the UI reported `Live data ready · map renderer unavailable`.

Root cause in the accepted public page:

- MapLibre GL JS and CSS were loaded directly from `unpkg.com`;
- `stream-map-entry.ts` requires `window.maplibregl` synchronously during initialization;
- when that external renderer global is absent, the implementation correctly fails closed to `renderer-error`, leaving the basemap and country markers unavailable even though the API data is ready.

Candidate repair:

- pin `maplibre-gl` 6.4.1 as a web runtime dependency;
- bundle MapLibre JS and CSS through Vite;
- install the bundled namespace before importing the existing Stream Map entry;
- remove the public page's direct `unpkg.com/maplibre-gl` JS/CSS dependency;
- preserve the existing OpenFreeMap dark basemap, data/evidence contracts, country-marker logic and fail-closed states unchanged.

Boundary:

- no API contract change;
- no reviewed-evidence change;
- no Twitch/Kick collector change;
- no D1 write/schema change;
- no cadence/retention change;
- no Current/IRL or Kick activation;
- no production deployment is performed by this implementation branch.
