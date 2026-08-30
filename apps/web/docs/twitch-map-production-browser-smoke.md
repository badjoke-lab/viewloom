# Twitch Map production browser smoke

The permanent `Twitch Map Production Browser Smoke` workflow waits for `/deployment.json` to report the exact pushed `main` SHA before it evaluates the public Stream Map.

It then opens `https://www.viewloom.net/twitch/map/` in Chromium and requires both Country and City modes to reach `basemap-ready`, mount exactly one MapLibre canvas and zoom control, expose at least one country marker, report at least one mapped stream, and emit no page or console errors.

This file is intentionally inside `apps/web/**` so the first merge that installs the permanent smoke is guaranteed to enter the Cloudflare Pages Git-integration build path. It changes no runtime behavior.
