# Heatmap PR 10 Verification

PR 10 is ready only when all of the following pass:

- Web TypeScript check
- Web production build
- all previous Heatmap verifiers
- Heatmap summary and legend verifier
- existing Web verification workflow

Manual browser checks required before final cutover:

1. four summary values appear below the workspace
2. unavailable activity never produces a fake activity leader
3. sampled zero and unavailable activity display differently
4. the legend explains area, rising, falling, stable, and activity accent
5. coverage distinguishes observed records from the configured collection limit
6. has-more, covered pages, source mode, method, and snapshot age are visible
7. automatic refresh visibly reports the sixty-second stored-snapshot cadence
8. request progress and failures are visible
9. manual Refresh remains separate from automatic refresh
10. Twitch and Kick use the same behavior

Mobile bottom-sheet and keyboard acceptance remain PR 11. Cross-platform browser and performance completion remain PR 12.
