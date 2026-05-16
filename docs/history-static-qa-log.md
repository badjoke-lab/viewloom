# ViewLoom History Static QA Log

Status: active static QA log  
Scope: Twitch History / Trends page  
Created: 2026-05-16

## 1. Target

URL:

- `/twitch/history/`

Files checked:

- `apps/web/twitch/history/index.html`
- `apps/web/src/history-entry.ts`
- `apps/web/functions/api/history.ts`

## 2. Entry check

Status: pass

Confirmed:

- History entry page uses `body[data-page="twitch-history"]`.
- Entry scripts are:
  - `/src/history-entry.ts`
  - `/src/label-risk-cleanup.ts`
  - `/src/history-unify.ts`
- Page title and description identify History & Trends as an unofficial ViewLoom view for Twitch live-stream data.

## 3. Frontend implementation check

Status: pass with known follow-up

Confirmed in `history-entry.ts`:

- History page owns its app shell.
- The page fetches `/api/history` directly.
- Supported frontend controls:
  - `period=7d`
  - `period=30d`
  - custom `from` / `to`
  - `metric=viewer_minutes`
  - `metric=peak_viewers`
- The page validates custom range locally:
  - start date required
  - end date required
  - start must be before end
  - future dates are blocked
  - custom range is capped at 90 days
- Sections rendered:
  - summary cards
  - daily trend chart
  - selected day panel
  - peak archive
  - top streamer ranking
  - daily cards
  - coverage / data quality
  - method notes
- Empty states are explicit:
  - no observed history
  - no peak archive
  - no streamer ranking
  - no daily cards
- Missing days are rendered as muted chart slots rather than being hidden.

## 4. Owned API check

Status: pass

Confirmed in `/api/history`:

- API is ViewLoom-owned.
- API reads `DB_TWITCH_HOT.minute_snapshots`.
- API does not proxy to `livefield.pages.dev`.
- API supports:
  - `period=7d`
  - `period=30d`
  - custom `from` / `to`
  - `metric=viewer_minutes|peak_viewers`
- API caps custom range at 90 days.
- API returns fields used by frontend:
  - `source`
  - `state`
  - `platform`
  - `period`
  - `metric`
  - `summary`
  - `daily`
  - `topStreamers`
  - `coverage`
  - `notes`
- API aggregates:
  - daily viewer-minutes
  - daily peak viewers
  - peak streamer name
  - top streamers
  - previous-period change percentage
  - coverage state
- API marks demo days as `coverageState: demo`.
- API returns `state: empty` when no daily history exists.
- API returns `state: partial` when coverage is not good.

## 5. Known follow-up

Status: follow-up required

History currently links selected day / peak archive / daily cards to:

- `/twitch/day-flow/?date=YYYY-MM-DD`
- `/twitch/battle-lines/?date=YYYY-MM-DD`

Day Flow supports `date` through the frontend/API path.

Battle Lines currently has an API that supports `from` / `to`, but the Battle Lines frontend does not yet convert `date=YYYY-MM-DD` into API `from` / `to` params.

Follow-up decision:

- Either implement `date` handling in Battle Lines frontend, or remove the date query from History → Battle Lines links until that support exists.
- Do not leave a day-specific link that visually suggests filtered Battle Lines data if the page still loads the rolling 24h Battle Lines window.

## 6. Browser QA still required

Desktop viewport:

- 1440 x 900

Must verify in browser:

- page loads without runtime errors.
- period controls switch Last 7 days / Last 30 days / Custom.
- custom range validation appears for invalid ranges.
- metric controls switch Viewer-minutes / Peak viewers.
- daily trend chart renders observed and missing days correctly.
- selecting chart bars updates selected day.
- peak archive buttons update selected day.
- daily cards update selected day.
- ranking section is readable.
- coverage / data quality section is visible.
- method notes are visible.
- empty/partial/demo states do not look like complete real history.

Mobile viewport:

- 390 x 844

Must verify in browser:

- controls stack without horizontal overflow.
- daily trend chart remains readable.
- selected day panel remains readable.
- peak archive and daily cards remain tappable.
- ranking does not overflow horizontally.
- coverage and method notes remain readable.

## 7. Current QA order after this log

1. Decide/fix History → Battle Lines day-specific link behavior.
2. Start real browser QA for Twitch pages:
   - Heatmap desktop/mobile
   - Day Flow desktop/mobile
   - Battle Lines desktop/mobile
   - Status desktop/mobile
   - History desktop/mobile
