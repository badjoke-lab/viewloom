# Heatmap PR 9 Verification

PR 9 is ready only when all of the following pass:

- Web TypeScript check
- Web production build
- every previous Heatmap verifier
- selected-inspector verifier
- existing Web verification workflow

Manual browser checks required before final cutover:

1. selecting a tile updates the completed inspector in Twitch and Kick
2. Wide shows the inspector below the map and Split shows the same data in the right rail
3. long names and titles do not widen or break the page
4. observed rank and share match the current valid snapshot
5. momentum shows value, direction, and the five-minute window
6. unavailable activity never appears as a measured zero
7. observed-since, duration, peak, and peak time either load from stored snapshots or show an explicit unavailable state
8. external provider, Battle Lines, and History links carry the selected stream
9. refreshing the Heatmap clears stale inspector data before the new response arrives
10. legacy selected-detail writes do not overwrite the completed inspector

Summary, legend, coverage, auto-refresh visibility, mobile bottom sheet, keyboard work, and final cutover are not PR 9 acceptance items.
