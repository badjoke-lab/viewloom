# Portal Briefing Redesign

## Purpose

The ViewLoom portal is a lightweight entrance to two separate observation sites. It must explain the operating model, show the latest provider summaries, and route users to the appropriate analysis page without combining Twitch and Kick data.

## Public structure

1. ViewLoom hero and operating facts
2. Separate Twitch and Kick provider briefing cards
3. Four shared analysis views: Heatmap, Day Flow, Battle Lines, and History
4. Data-boundaries note

## Data rules

- `/api/twitch-home` and `/api/kick-home` are fetched independently.
- Provider values are never added, averaged, ranked, or otherwise merged.
- Error, stale, partial, empty, and demo states remain visible.
- Each provider keeps its own coverage note and Status route.

## Interaction rules

- Provider cards open `/twitch/` or `/kick/`.
- Analysis cards expose one route per provider.
- Mobile navigation updates `aria-expanded`.
- Loading and failure states use readable text rather than unexplained placeholders.

## Files

- `index.html`
- `src/portal-page.ts`
- `src/portal-page.css`
- `src/mock-site.ts`
- `scripts/verify-home-qa.mjs`
- `docs/home-qa-contract.md`
