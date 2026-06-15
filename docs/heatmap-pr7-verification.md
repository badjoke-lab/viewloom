# Heatmap PR 7 Verification

PR 7 is ready only when all of the following pass:

- Web TypeScript check
- Web production build
- Heatmap page boundary verifier
- Heatmap data-state verifier
- Heatmap Wide-layout verifier
- Heatmap dense-field verifier
- Heatmap semantic-LOD verifier
- Heatmap camera-control verifier
- existing Web verification workflow

Manual browser checks required before final cutover:

1. normal wheel scrolls the page
2. Ctrl, Alt, or Meta plus wheel zooms around the pointer
3. plus and minus step zoom without exposing empty world space
4. percentage button returns to 100%
5. Reset view restores the centered initial camera
6. click selects a tile
7. drag pans and does not select on release
8. double click zooms in and Shift plus double click zooms out
9. Refresh loads the latest stored snapshot and preserves camera state
10. resize preserves a valid clamped camera
11. Twitch and Kick use the same controls

Split world reuse and the bottom position rail are not acceptance items for PR 7. They belong to PR 8.
