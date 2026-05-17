# ViewLoom Kick Static Audit Log

Status: active static audit  
Scope: Kick pages after Twitch recovery/debug work  
Created: 2026-05-16

## 1. Purpose

This log records the current Kick baseline before more implementation work.

Twitch currently has recovered owned APIs, QA logs, and debug helpers. Kick has a shared shell and feature entries, but must be checked and improved separately.

## 2. Pages checked

Checked current Kick entry pages:

- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`

No `/kick/status/` entry was found during this pass.

## 3. Current Kick entries

### `/kick/`

- path: `apps/web/kick/index.html`
- body: `data-page="kick"`
- scripts:
  - `/src/main.ts`
  - `/src/label-risk-cleanup.ts`

Status: shell exists.

### `/kick/heatmap/`

- path: `apps/web/kick/heatmap/index.html`
- body: `data-page="kick-heatmap"`
- scripts:
  - `/src/main.ts`
  - `/src/label-risk-cleanup.ts`

Status: shell-level feature entry exists.

### `/kick/day-flow/`

- path: `apps/web/kick/day-flow/index.html`
- body: `data-page="kick-day-flow"`
- scripts:
  - `/src/main.ts`
  - `/src/label-risk-cleanup.ts`

Status: shell-level feature entry exists.

### `/kick/battle-lines/`

- path: `apps/web/kick/battle-lines/index.html`
- body: `data-page="kick-battle-lines"`
- scripts:
  - `/src/main.ts`
  - `/src/label-risk-cleanup.ts`

Status: shell-level feature entry exists.

## 4. Shared shell status

Observed in `apps/web/src/main.ts`:

- `PageKind` includes `kick`, `kick-heatmap`, `kick-day-flow`, and `kick-battle-lines`.
- `SiteKey` includes `kick`.
- Portal cards include `Kick data`.
- Kick site metadata exists and presents Kick as a parallel provider shell.

This means Kick routing and shell content exist. It does not yet mean Kick is equal to the recovered Twitch feature pages.

## 5. Missing or not-yet-confirmed Kick pieces

Required next:

- Kick Status page entry.
- Kick-specific status surface.
- Kick-specific data-state labels for not-ready, empty, stale, demo, or error.
- Kick Heatmap state/coverage display.
- Kick Day Flow state/coverage display.
- Kick Battle Lines state/coverage display.

Debug parity gaps:

- Twitch Battle Lines has debug details.
- Twitch Day Flow has debug details.
- Kick does not yet have equivalent debug helpers.

## 6. Label requirements

Kick pages should keep the same role naming pattern:

- `KICK DATA · NOW` for Heatmap
- `KICK DATA · TODAY` for Day Flow
- `KICK DATA · RIVALRY` for Battle Lines

Avoid older or mixed wording:

- `Kick ViewLoom`
- standalone `Compare` as the role label
- mixed Twitch/Kick labels inside a provider page

## 7. Recommended next order

1. Add `/kick/status/`.
2. Link Kick status from Kick shell surfaces.
3. Add honest state strips to Kick feature pages if missing.
4. Add Kick debug helpers only after the Kick API contract is clear.

## 8. Current conclusion

Kick is in shell/static-audit phase.

Next implementation target:

- Add Kick Status page / status surface.
