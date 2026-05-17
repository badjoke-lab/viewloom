# ViewLoom Kick API Recovery Plan

Status: active implementation plan  
Scope: Kick real-data recovery after shell/status hardening  
Created: 2026-05-17

## 1. Current baseline

Kick currently has these visible routes:

- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`
- `/kick/status/`

Recent completed work:

- Kick static audit log added.
- Kick status page added.
- Kick status links added to Kick shell pages.
- Kick feature state strips added so the pages do not look equivalent to recovered Twitch pages.

Current conclusion:

- Kick shell exists.
- Kick status route exists.
- Kick feature pages are still shell-level.
- Kick must not reuse Twitch status, Twitch freshness, or Twitch debug state.

## 2. Recovery goal

Bring Kick from shell-level pages to provider-specific real-data pages without weakening the Twitch recovery rules.

Kick must have its own:

- API endpoints
- collector/data source assumptions
- status state
- empty/stale/error handling
- feature data contracts
- debug surfaces after contracts are stable

## 3. Required API endpoints

Target endpoints:

- `/api/kick-heatmap`
- `/api/kick-day-flow`
- `/api/kick-battle-lines`
- optional later: `/api/kick-status`

These endpoints should not return Twitch data. If Kick data is unavailable, they must return an explicit not-ready, empty, stale, or error state.

## 4. Endpoint contracts

### `/api/kick-heatmap`

Purpose:

- Current Kick live field for Heatmap.

Minimum response fields:

- `source`
- `platform: "kick"`
- `state`
- `status`
- `updatedAt`
- `items`
- `coverageNote`
- `notes`

State rules:

- `live`: real Kick data with fresh observed items.
- `empty`: endpoint works but has no qualifying Kick items.
- `stale`: data exists but freshness is outside accepted range.
- `not_ready`: endpoint exists but real Kick data path is not connected.
- `error`: endpoint failed.

### `/api/kick-day-flow`

Purpose:

- Kick equivalent of Day Flow.

Minimum response fields:

- `ok`
- `source`
- `platform: "kick"`
- `state`
- `status`
- `lastUpdated`
- `selectedDate`
- `bucketSize`
- `topN`
- `rangeMode`
- `windowStart`
- `windowEnd`
- `buckets`
- `totalViewersByBucket`
- `bands`
- `detailPanelSource`
- `activity`
- `coverageNote`
- `partialNote`

Required behavior:

- Support `top`.
- Support `bucket` if data resolution allows it.
- Return explicit not-ready or empty state if no real Kick samples exist.
- Do not borrow Twitch Day Flow debug, source, or freshness state.

### `/api/kick-battle-lines`

Purpose:

- Kick equivalent of Battle Lines.

Minimum response fields:

- `source`
- `platform: "kick"`
- `state`
- `status`
- `updatedAt`
- `top`
- `bucket`
- `metric`
- `lines`
- `primaryBattle`
- `recommendedBattle`
- `recommendedQuality`
- `secondaryBattles`
- `events`
- `notes`

Required behavior:

- Preserve missing/not-observed line breaks.
- Do not draw fake continuity.
- Recommended pair should keep popularity as a gate and also require readable overlap.
- If Kick samples are too thin, return not-ready/empty instead of pretending the chart is real.

## 5. Frontend recovery order

### Step 1: API stubs with honest states

Add provider-specific endpoints that return stable contracts even before real data is connected.

Completion condition:

- All three Kick API endpoints respond.
- They return `platform: "kick"`.
- They clearly report `not_ready` when real data is unavailable.
- Feature pages can consume them without crashing.

### Step 2: Feature state surfaces

Update Kick feature pages to read the Kick endpoint state.

Completion condition:

- Heatmap, Day Flow, and Battle Lines show not-ready/empty/stale/error honestly.
- Users cannot mistake shell-level Kick pages for recovered real-data pages.

### Step 3: Connect real Kick samples

Once collector/storage path is confirmed, connect endpoints to actual Kick data.

Completion condition:

- `/api/kick-heatmap` returns real observed Kick items.
- `/api/kick-day-flow` returns bands from real Kick samples.
- `/api/kick-battle-lines` returns lines from real Kick samples.

### Step 4: Add Kick debug helpers

Only after API contracts are stable.

Completion condition:

- Kick Day Flow debug details read `/api/kick-day-flow`.
- Kick Battle Lines debug details read `/api/kick-battle-lines`.
- Debug clearly says Kick and never reports Twitch state.

### Step 5: Kick QA

After real-data or honest not-ready state is stable.

Completion condition:

- Static QA log updated.
- Browser QA can be done later when user chooses.

## 6. Do not do

- Do not reuse Twitch data under Kick labels.
- Do not present demo or shell data as real Kick data.
- Do not add debug helpers that silently call Twitch endpoints.
- Do not move Kick to parity QA before state honesty is visible.
- Do not collapse Twitch and Kick feature pages into one mixed provider page.

## 7. Immediate next implementation

Next PR after this plan:

- Add honest Kick API stubs:
  - `/api/kick-heatmap`
  - `/api/kick-day-flow`
  - `/api/kick-battle-lines`

Expected output:

- Endpoints compile.
- Endpoints return stable not-ready JSON contracts.
- They are safe for frontend integration.
