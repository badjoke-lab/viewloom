# ViewLoom Local Watchlist v1 specification

Status: active permanent product specification
Version: 1.0
Last updated: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Capability authority: `next-feature-data-capability-audit.md`
Implementation plan: `watchlist-v1-implementation-plan.md`
Active working note: `../work-in-progress/watchlist-v1-working-note.md`

## 1. Purpose

Local Watchlist is a provider-specific browser-local list of channel ids that helps a visitor reopen saved channels and inspect the latest and retained evidence already available in ViewLoom.

It answers:

1. which Twitch or Kick channel ids the visitor saved in this browser;
2. whether each saved id appears in the latest available bounded provider observation;
3. what latest observed viewer count and update time are available;
4. whether each saved id appears in the selected retained History period;
5. which retained viewer-minute, peak, average, observed-time, and daily-appearance facts are available;
6. which provider-safe ViewLoom and external links can be opened next.

It does not answer:

- whether a channel is definitively live or offline;
- whether ViewLoom continuously tracked the channel;
- the channel's exact stream sessions;
- the channel's complete provider history;
- category or language history;
- whether an alert condition occurred while the page was closed.

## 2. Product position

```text
Heatmap      = latest bounded observation
Day Flow     = one day or rolling 24-hour movement
Battle Lines = rivalry inside a bounded raw window
History      = retained period-wide daily trends
Channel      = one channel's retained History footprint
Watchlist    = browser-local shortcuts plus bounded latest and retained evidence
```

Watchlist is a secondary utility surface, not a sixth primary visualization and not a replacement for History or Channel.

It must not be inserted into the primary feature-tab sequence as an equal visualization. Provider Home may expose it in a clearly secondary `Saved channels` or utility area.

## 3. Provider separation

Canonical routes:

```text
/twitch/watchlist/
/kick/watchlist/
```

Mandatory rules:

- Twitch Watchlist reads only Twitch local storage and Twitch APIs;
- Kick Watchlist reads only Kick local storage and Kick APIs;
- saved ids, display names, facts, links, counts, and states never cross providers;
- no cross-platform identity matching;
- no combined saved count, viewer total, ranking, or current status;
- switching providers opens the other provider's independent Watchlist rather than converting entries;
- a URL or id from the other provider is rejected, not silently reclassified.

## 4. Route, URL, and history state

Supported query state:

```text
period=7d|30d
```

Rules:

- the default period is `30d` and is omitted from the clean canonical URL;
- `period=7d` is the only non-default period state in v1;
- invalid period values fall back to `30d` without writing storage;
- period changes update browser history and issue exactly one new provider History request;
- Back and Forward restore the period and reuse the latest Heatmap payload already held by the current page instance;
- saved ids, filter text, expanded state, and ordering are not serialized into the URL;
- no channel id or local list contents are added to analytics URLs, canonical URLs, or share metadata;
- Watchlist has no public share/copy-list URL in v1.

## 5. Local storage contract

### 5.1 Keys

Use one versioned key per provider:

```text
viewloom.watchlist.twitch.v1
viewloom.watchlist.kick.v1
```

No shared cross-provider key is allowed.

### 5.2 Serialized document

```json
{
  "schema": "viewloom-watchlist-v1",
  "provider": "twitch",
  "revision": 1,
  "updatedAt": "2026-06-24T00:00:00.000Z",
  "entries": [
    {
      "channelId": "example_channel",
      "displayName": "Example Channel",
      "addedAt": "2026-06-24T00:00:00.000Z"
    }
  ]
}
```

For Kick, `provider` is `kick` and the Kick key is used.

The array order is the persisted manual order. No separate numeric position field is stored.

### 5.3 Entry limits

```text
maximum entries: 50 per provider
initial visible entries: 12
```

Rules:

- the limit applies after normalization and deduplication;
- adding the fifty-first unique id fails with visible feedback and does not modify storage;
- `Show all` reveals all saved entries without a request;
- `Show recent` restores the first twelve saved entries without a request;
- local filtering searches all fifty entries, not only the visible twelve;
- filtering and expansion never alter persisted order.

### 5.4 Channel-id normalization

A valid stored id:

- is trimmed;
- is converted to lowercase;
- contains only `a-z`, `0-9`, underscore, and hyphen;
- contains between 1 and 64 characters;
- does not begin or end with a hyphen introduced by normalization;
- is treated as provider-specific even when the same text exists on both providers.

Input may be:

```text
plain provider channel id
https://www.twitch.tv/<id>
https://kick.com/<id>
```

Rules:

- a Twitch URL is accepted only by Twitch Watchlist;
- a Kick URL is accepted only by Kick Watchlist;
- URL query, fragment, trailing slash, and surrounding whitespace are discarded;
- unsupported hosts, extra path segments, empty ids, and invalid ids are rejected;
- normalization must not guess a provider from an unrecognized URL;
- the normalized id is the identity and deduplication key.

### 5.5 Display name

- display name is optional input metadata;
- it is trimmed and limited to 100 Unicode characters;
- control characters are removed;
- if absent, the normalized id is displayed;
- Heatmap or History display names may improve the rendered label for the current page load;
- API-derived display names do not silently overwrite the stored display name in v1;
- adding an already-saved id does not reorder it, change `addedAt`, or overwrite its stored name.

### 5.6 Add, remove, reorder, and clear

Add:

- a new valid id is inserted at the top;
- `addedAt` and document `updatedAt` use the current ISO timestamp;
- the write must succeed before the visible list claims that the id is saved;
- duplicate add returns `Already saved` and performs no write or request.

Remove:

- removal is explicit per entry;
- the storage write must succeed before the entry disappears;
- removal performs no network request.

Reorder:

- every entry has keyboard-operable `Move up` and `Move down` controls;
- drag-and-drop may be added only as an enhancement and must never be the only mechanism;
- reorder persists the array order and performs no network request;
- moving the first entry up or the last entry down is disabled with an accessible reason.

Clear all:

- `Clear Watchlist` requires explicit confirmation;
- cancellation changes nothing;
- successful clear removes the provider key and returns to the empty state;
- it never clears the other provider's key.

### 5.7 Validation, repair, and recovery

On read:

1. a missing key produces a valid empty Watchlist;
2. JSON parse failure produces `Storage unavailable or corrupted` and does not overwrite the value;
3. wrong schema, provider, revision, or entries type produces the same recoverable storage-error state;
4. a structurally valid document is normalized entry by entry;
5. invalid entries are removed, duplicates keep their first occurrence, and entries beyond fifty are removed;
6. a repaired document is written once and exposes `Some invalid saved entries were removed.`;
7. if repair writing fails, keep the usable in-memory repaired list for the current page but show `Changes cannot be saved in this browser.`;
8. `Reset local Watchlist` is offered only in a storage-error state and requires confirmation.

No current legacy schema exists. Future migrations must be explicit by revision and must never reinterpret a provider.

### 5.8 Storage availability and write failure

- localStorage access is wrapped because browsers may deny reads or writes;
- when initial read is unavailable, render the page and storage explanation but do not claim any id is saved;
- add, remove, reorder, and clear controls that require persistence are disabled while storage is unavailable;
- quota or write failure keeps the last successfully persisted visible state;
- failure feedback uses `aria-live` and does not disappear before it can be read;
- no server fallback, cookie fallback, IndexedDB fallback, or memory-only saved claim is introduced in v1.

### 5.9 Cross-tab behavior

- listen to the browser `storage` event for the current provider key;
- a valid external change updates the visible local list without a network request;
- an invalid external value enters the storage-error state;
- the source tab already updates from its successful write and must not depend on a `storage` event;
- cross-tab support is same-origin browser synchronization, not account sync.

## 6. Data sources and request contract

### 6.1 Endpoints

```text
Twitch latest:   /api/twitch-heatmap
Kick latest:     /api/kick-heatmap
Twitch retained: /api/history?period=<7d|30d>&metric=viewer_minutes
Kick retained:   /api/kick-history?period=<7d|30d>&metric=viewer_minutes
```

No Watchlist-specific server API is required.

### 6.2 Initial load

If the provider Watchlist is empty or storage cannot expose entries:

```text
Heatmap requests: 0
History requests: 0
```

If at least one valid saved id exists:

```text
Heatmap requests: exactly 1
History requests: exactly 1
```

The two requests may run in parallel and fail independently.

### 6.3 Reuse and refresh

- all saved ids are matched locally against the two loaded payloads;
- no per-channel request loop is allowed;
- filter, expand, collapse, add, remove, reorder, and task-local rendering reuse loaded data;
- adding an id after data loaded immediately matches it against the loaded payloads and performs no request;
- period change performs exactly one new provider History request and reuses the latest Heatmap payload;
- an explicit `Refresh data` action performs exactly one new Heatmap request and one new History request;
- no interval polling, background refresh, service worker monitoring, or page-hidden polling is allowed;
- repeated clicks while refresh is in flight do not create duplicate requests;
- a failed endpoint may be retried explicitly without discarding the successful endpoint's data.

### 6.4 Matching

- match by normalized provider channel id;
- latest evidence is matched against Heatmap item ids;
- retained period summary is matched against History `topStreamers[]`;
- retained daily appearances are matched against History daily streamer rows;
- API display names are presentation fallbacks only;
- missing numeric facts remain unavailable, not zero;
- no fuzzy display-name match is allowed.

## 7. Evidence-state model

Latest observation and retained History are independent evidence axes. One must not overwrite the other.

### 7.1 Provider data state

The page exposes separate provider-level states:

```text
latest: loading | live | partial | stale | empty | error
history: loading | ready | partial | empty | error
storage: ready | repaired | empty | unavailable | corrupted | write_error
```

Provider source, update time, requested period, and coverage note remain visible near the top.

### 7.2 Per-entry latest state

#### Present in fresh/latest payload

Primary label:

```text
In latest observed set
```

May show:

- latest observed viewers;
- latest provider observation time;
- latest title when the provider payload supplies it;
- latest momentum as supporting data only when already supplied.

It must not display `Live` as an authoritative channel state.

#### Present in stale payload

Primary label:

```text
In latest available observed set
```

Required qualifier:

```text
Provider data is stale
```

#### Absent from a usable payload

Primary label:

```text
Not in latest observed set
```

Required qualifier:

```text
Not confirmed offline
```

No zero viewer value is synthesized.

#### Latest endpoint unavailable

Primary label:

```text
Latest observation unavailable
```

No presence or absence conclusion is shown.

### 7.3 Per-entry retained state

#### Present in retained period summary or daily rows

Primary label:

```text
Present in retained History result
```

May show, when available:

- period viewer-minutes;
- peak viewers;
- average viewers;
- observed minutes;
- retained daily Top 10 appearance count;
- most recent retained appearance;
- retained rank only with the existing bounded-result limitation.

#### Absent from an otherwise usable History payload

Primary label:

```text
Not in retained History result
```

Required qualifier:

```text
No complete history is implied
```

No zero values are synthesized.

#### Partial or unavailable History

Primary labels:

```text
Retained History is partial
Retained History unavailable
```

No retained-presence conclusion is shown when the payload cannot support it.

## 8. Information architecture

Accepted page order:

```text
1. global masthead and provider breadcrumb
2. existing primary feature tabs, unchanged
3. Watchlist hero and local-only explanation
4. provider/storage/source facts
5. add and period controls
6. latest and History load/refresh feedback
7. saved-channel list
8. local storage, evidence, and privacy limits
```

Watchlist uses one page task. It does not add Overview/Days/Report tabs in v1.

### 8.1 Hero

Required content:

- `TWITCH DATA · LOCAL WATCHLIST` or `KICK DATA · LOCAL WATCHLIST`;
- `Local Watchlist` heading;
- `Saved only in this browser` label;
- provider-specific saved count;
- selected retained period;
- latest and History source/state;
- a concise statement that absence is not offline proof.

### 8.2 Controls

Required controls:

```text
channel id or provider URL input
Add channel
Last 7 days
Last 30 days
Refresh data
Show all / Show recent when needed
local filter when entries exist
Clear Watchlist
```

Rules:

- input has a persistent visible label and provider-specific example;
- Enter may submit the add form;
- other-provider URLs show a specific rejection;
- period and refresh controls are independent of storage controls;
- clear is visually separated from ordinary actions;
- feedback areas identify whether a message concerns storage, latest data, or History.

### 8.3 Saved-channel card

Required card order:

1. stored or API-improved display name;
2. normalized provider id;
3. external provider link;
4. latest-observation evidence;
5. retained-period evidence;
6. ViewLoom links;
7. move and remove controls.

Primary ViewLoom link:

```text
Open Channel
```

Additional provider-safe links may include Heatmap, History, Day Flow, or Battle Lines only when the target route and query are valid. Watchlist must not invent a channel filter for a page that does not support one.

### 8.4 Empty state

Required content:

```text
No channels saved in this browser.
Add a provider channel id or URL to create this local Watchlist.
Nothing is uploaded to a ViewLoom account.
```

No Heatmap or History request is sent in this state.

### 8.5 Partial and error states

- storage failure does not hide the page explanation or provider navigation;
- latest failure does not hide retained History evidence;
- History failure does not hide latest evidence;
- total page failure is not used when one evidence source remains usable;
- retry controls are bound to the failed source or to the explicit combined refresh;
- stale, partial, missing, and error states use text and symbols, not color alone.

## 9. Approved entry points

### 9.1 Watchlist page

The add form is the universal entry point and accepts an id or same-provider URL.

### 9.2 Channel page

Provider Channel pages add one secondary action:

```text
Save to Watchlist
Saved in Watchlist
```

Rules:

- it uses the current provider and normalized Channel id;
- invalid or missing Channel id disables the action;
- save performs no API request;
- successful state is derived from the same provider localStorage key;
- removing from Channel is not required; `Saved in Watchlist` links to Watchlist management rather than acting as a destructive toggle.

### 9.3 Provider Home

Provider Home adds a secondary utility link or card:

```text
Local Watchlist
Saved channels in this browser
```

It must not displace Heatmap, Day Flow, Battle Lines, History, or Status, and it must not display a cross-provider count.

### 9.4 Explicitly deferred entry points

v1 does not add save buttons to every Heatmap item, History row, Battle Lines line, or Day Flow band. Those high-density entry points are deferred until the basic list behavior is production-accepted.

## 10. Visual and responsive contract

- use the accepted ViewLoom dark surface hierarchy;
- Twitch uses disciplined purple accents and Kick disciplined green accents;
- provider accent never replaces storage, source, freshness, partial, missing, or error semantics;
- saved cards must look active and useful, not like disabled placeholders;
- latest evidence and retained evidence are visually separate inside each card;
- primary facts are latest observed viewers and retained viewer-minutes/peak when available;
- supporting facts use lower but readable hierarchy;
- cards use a responsive grid on desktop and a single readable column on mobile;
- page-level horizontal overflow is prohibited at 360px, 390px, 820px, and 1440px reference widths;
- long names, ids, URLs, evidence notes, and error strings wrap without clipping;
- default twelve-entry bounding prevents an unbounded first render;
- mobile controls do not reproduce a compressed desktop toolbar;
- primary mobile actions target at least 48px where practical;
- destructive actions remain visually distinct without relying on red alone;
- reduced-motion preferences are respected.

## 11. Accessibility contract

- all form fields have persistent labels;
- validation errors are associated with the input;
- storage and data feedback use appropriate `aria-live` regions;
- card order follows persisted visual order in the DOM;
- move controls expose the entry name and direction in their accessible names;
- focus remains predictable after add, remove, move, show-all, and reset operations;
- after removal, focus moves to the next entry, previous entry, or add input;
- after add, focus may move to the new card heading or remain on the input with announced success;
- no interaction depends on hover, drag, pointer precision, or color alone;
- external links state the provider in accessible text;
- loading placeholders do not trap focus;
- `prefers-reduced-motion` disables nonessential transitions.

## 12. SEO and metadata

Both Watchlist routes use:

```text
<meta name="robots" content="noindex,follow">
```

Reason:

- the meaningful content is browser-local and personalized;
- the generic empty route is not a primary discovery surface;
- saved ids must not enter search indexes through page state.

Each route still requires:

- provider-specific title and description;
- canonical route without query state;
- provider-safe Open Graph metadata containing no saved ids;
- normal links back to the provider Home and core features.

## 13. Privacy and analytics

- saved entries stay in browser localStorage;
- ViewLoom does not create an account or upload the list;
- saved ids and display names are not added to analytics events in v1;
- ordinary route-level pageview analytics may continue without local list contents;
- local storage use and clear/reset controls are disclosed on the page;
- external provider links follow normal browser navigation and are not presented as ViewLoom tracking confirmation;
- no cookies are introduced for Watchlist state.

## 14. Performance contract

- zero entries means zero feature-data requests;
- nonempty initial load means two requests total;
- request work is independent of entry count from one to fifty;
- local operations do not trigger API requests;
- rendering fifty cards must not require server pagination;
- API payloads are parsed once per response and indexed by normalized id;
- page refresh must not scan D1 directly or introduce a Watchlist-specific server endpoint;
- no new cron, collector work, binding, D1/KV/R2 storage, or retention is allowed in v1.

## 15. Non-goals

Local Watchlist v1 does not include:

- login, account, profile, or authentication;
- cloud or cross-device synchronization;
- server-side preferences;
- import/export of the local list;
- shared Watchlist URLs;
- push, email, webhook, browser, or in-page background alerts;
- background polling;
- authoritative live/offline status;
- exact stream sessions or observed-run reconstruction;
- unrestricted provider channel search;
- provider-wide rankings or totals;
- cross-provider identity merge;
- category or language history;
- clips, VODs, schedules, or external event data;
- AI recommendations or interpretation;
- automatic saving from dense visualization rows;
- changing existing Heatmap, Day Flow, Battle Lines, History, Channel, or Status data contracts.

## 16. Production acceptance requirements

Before production acceptance, verify independently for Twitch and Kick:

- route and metadata;
- provider-separated storage keys;
- empty-state zero-request behavior;
- nonempty two-request initial behavior;
- period-change History-only request behavior;
- explicit refresh request behavior;
- no per-entry request growth at fifty entries;
- add by id and same-provider URL;
- rejection of cross-provider and invalid URLs;
- duplicate, maximum-limit, remove, reorder, clear, repair, corrupted, unavailable, and write-failure storage states;
- cross-tab storage synchronization;
- latest present, latest absent, stale, partial, empty, and error states;
- retained present, absent, partial, empty, and error states;
- exact absence and limitation language;
- Channel save action and provider Home utility link;
- keyboard focus, accessible names, live feedback, reduced motion, touch targets, and no overflow;
- no saved ids in analytics, canonical metadata, or URL state;
- no change to existing provider API, D1, collector, cron, retention, or primary feature meaning.

## 17. Completion definition

Local Watchlist v1 is complete only after:

1. W1–W4 implementation and candidate gates pass;
2. an approved `preview-*` branch verifies real Twitch and Kick bindings separately;
3. desktop, tablet, 390px, and 360px artifacts are reviewed;
4. the exact production `main` SHA is verified;
5. temporary Watchlist notes and markers are retired;
6. permanent acceptance evidence is recorded;
7. existing production core and History/Channel contracts remain green.
