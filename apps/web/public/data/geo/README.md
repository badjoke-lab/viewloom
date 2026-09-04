# Stream Map country geometry

The `countries-110m-*.geojson` files are simplified, coordinate-rounded country polygons derived from Natural Earth low-resolution country boundaries for the ViewLoom Twitch Country renderer.

Natural Earth data is public domain. The geometry here is stored in-repository so the public Stream Map does not depend on a runtime fetch from GitHub or another third-party geometry host.

This first vendored bundle covers the countries supported by the existing Country aggregate map renderer. Very small countries or territories that do not have a usable polygon at this scale, including Singapore and Hong Kong, remain aggregate country-marker fallbacks. These markers represent country totals, not creator coordinates.
