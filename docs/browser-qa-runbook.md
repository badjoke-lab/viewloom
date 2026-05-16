# ViewLoom Browser QA Runbook

Status: active QA runbook  
Scope: Twitch core pages after owned API recovery  
Created: 2026-05-16

## 1. Purpose

This runbook fixes the browser QA target before further visual or interaction work.

The goal is not to prove that the pages merely load. The goal is to verify that the restored ViewLoom pages still meet the agreed non-degradation policy after the Cloudflare Free recovery work.

Related documents:

- `docs/viewloom-non-degradation-policy.md`
- `docs/viewloom-free-plan-recovery-audit.md`
- `docs/heatmap-canvas-qa-gate.md`

## 2. Required local commands before browser QA

Run these first:

```bash
pnpm install --no-frozen-lockfile
pnpm typecheck:web
pnpm build:web
```

Current CI gate already covers these commands.

A browser QA session must not start from a failing build.

## 3. Target URLs

Primary Twitch pages:

- `/twitch/`
- `/twitch/heatmap/`
- `/twitch/day-flow/`
- `/twitch/battle-lines/`
- `/twitch/history/`
- `/twitch/status/`

Global pages:

- `/`
- `/status/` if present

Kick pages are phase 6 and must be checked later:

- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`
- `/kick/status/`

## 4. Desktop viewport gate

Desktop viewport baseline:

- width: 1440px
- height: 900px

Each primary page must pass:

- no horizontal page overflow
- no broken shell/header/footer layout
- page title and role label are visible
- status/data-state messaging is visible when data is empty, partial, stale, demo, or error
- no hidden official-platform wording such as `Twitch ViewLoom` or `Kick ViewLoom`
- Battle Lines role copy uses `Rivalry` where applicable

## 5. Mobile viewport gate

Mobile viewport baseline:

- width: 390px
- height: 844px

Each primary page must pass:

- no horizontal page overflow
- header/nav does not crush content
- controls remain reachable
- key chart/status content is not clipped
- cards and panels stack in a readable order
- tap targets remain usable

## 6. Heatmap page QA

URL:

- `/twitch/heatmap/`

Desktop pass conditions:

- Canvas Heatmap is the default recovered renderer.
- It must not silently downgrade to a simple card grid.
- wheel zoom works in the map area.
- pan works when map interaction is active.
- click/tap selects a stream/tile.
- selected stream detail updates after selection.
- zoom/reset controls are reachable.
- stale/partial/empty/demo/error states are honestly labeled.

Mobile pass conditions:

- normal page scroll is not hijacked by the map.
- explicit map control mode is reachable.
- zoom badge, mode badge, Control map, and Reset zoom are reachable.
- toolbar does not overflow horizontally.
- selected stream detail is reachable below or near the map.

Fail conditions:

- Canvas only appears behind a hidden query flag.
- chart disappears on normal mobile width.
- controls are clipped or unreachable.
- fallback/demo data is not labeled.

## 7. Day Flow page QA

URL:

- `/twitch/day-flow/`

API baseline:

- `/api/day-flow` must be ViewLoom-owned.
- `livefield.pages.dev` must not be used.

Desktop pass conditions:

- Full / Top Focus switching remains visible and usable.
- Volume / Share switching remains visible and usable.
- Top 10 / 20 / 50 selection remains visible and usable.
- 5m / 10m bucket selection remains reflected by the API metadata.
- `Others` is shown when applicable.
- Time Focus / selected stream detail remains reachable.
- biggest-rise information is not blank when the API has enough data to calculate it.
- activity is honestly labeled unavailable until real activity data is wired.

Mobile pass conditions:

- controls remain reachable without horizontal overflow.
- chart area remains visible.
- selected stream/detail panel remains readable.
- empty/partial/error states do not look like a normal successful chart.

Fail conditions:

- page depends on legacy proxy.
- Full / Top Focus is removed.
- Volume / Share is removed.
- Others handling disappears.
- unavailable activity is presented as real activity.

## 8. Battle Lines page QA

URL:

- `/twitch/battle-lines/`

API baseline:

- `/api/battle-lines` must be ViewLoom-owned.
- `livefield.pages.dev` must not be used.

Desktop pass conditions:

- primary battle is visible.
- secondary battles are available when enough lines exist.
- selected time / Time Inspector updates when chart time is selected.
- reversal events are shown when detected.
- missing / offline / not observed samples are visually distinct or honestly labeled.
- null unobserved values are not drawn as fake real samples.
- chart remains a rivalry/comparison surface, not a generic line chart only.

Mobile pass conditions:

- chart remains visible.
- inspector remains reachable.
- event/feed panel remains readable.
- controls do not overflow.

Fail conditions:

- selected time does nothing.
- Time Inspector is missing.
- not_observed/null values are connected as fake continuous data.
- page falls back to generic placeholder copy.

## 9. Status page QA

URL:

- `/twitch/status/`

Pass conditions:

- sourceMode is visible or reflected in the status copy.
- demo data is not presented as real.
- stale/strong_stale is not presented as fresh.
- failing/unconfigured/error maps to feature-level error rather than partial.
- feature matrix includes Heatmap, Day Flow, Battle Lines, and History.
- known limitations are visible.

Fail conditions:

- demo is treated as real.
- failing/error is softened into partial.
- feature status is hidden from the user.

## 10. History page QA

URL:

- `/twitch/history/`

Pass conditions:

- page loads without build/runtime errors.
- trend/ranking/daily archive sections remain visible if implemented.
- empty/partial data states are honest.
- links from history to detail views do not break.

Fail conditions:

- history page silently disappears from nav.
- placeholder data is presented as real history.

## 11. Completion criteria

Browser QA for this phase is complete only when:

- desktop and mobile checks are completed for each primary Twitch page
- no legacy Livefield URL remains in source
- CI passes
- data-state honesty is verified on Status and feature pages
- any failing browser observations are converted into follow-up PRs

## 12. Current next order

1. Run desktop QA for `/twitch/heatmap/`.
2. Run mobile QA for `/twitch/heatmap/`.
3. Run desktop QA for `/twitch/day-flow/`.
4. Run mobile QA for `/twitch/day-flow/`.
5. Run desktop QA for `/twitch/battle-lines/`.
6. Run mobile QA for `/twitch/battle-lines/`.
7. Run `/twitch/status/` data honesty QA.
8. Fix observed issues before moving to Kick phase.
