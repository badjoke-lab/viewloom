# ViewLoom Local Watchlist v1 specification

Status: accepted permanent product specification
Version: 1.2
Last updated: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1 complete
Capability authority: `next-feature-data-capability-audit.md`
Completed implementation record: `watchlist-v1-implementation-plan.md`
Production acceptance: `../operations/watchlist-production-acceptance-2026-06-25.md`

## 1. Purpose

Local Watchlist is a provider-specific browser-local list of channel ids. It helps a visitor reopen saved Twitch or Kick channels and inspect the latest and retained evidence already available in ViewLoom.

It answers:

1. which provider channel ids the visitor saved in this browser;
2. whether a saved id appears in the latest bounded observation;
3. which latest observed viewer, timestamp, title, and momentum facts are available;
4. whether a saved id appears in the selected retained History period;
5. which bounded retained viewer-minute, peak, average, duration, day-count, date, and rank facts are available;
6. how to reopen provider-specific Channel, History, and Heatmap pages.

It is not a cross-provider identity system, complete channel directory, authoritative live/offline monitor, complete session history, account, sync system, or alert service.

## 2. Routes and provider separation

```text
/twitch/watchlist/
/kick/watchlist/
```

Twitch and Kick remain separate in:

- routes;
- localStorage keys and documents;
- API requests;
- evidence facts;
- external links;
- ViewLoom Channel, History, and Heatmap links;
- D1 bindings and provider data;
- counts and limitation wording.

No combined total, rank, identity, or cross-provider saved list is allowed.

Watchlist is a secondary browser utility. It is available from provider Home and Channel surfaces but is not inserted into the primary Heatmap, Day Flow, Battle Lines, History, and Status tab sequence.

## 3. Storage contract

```text
schema: viewloom-watchlist-v1
revision: 1
Twitch key: viewloom.watchlist.twitch.v1
Kick key: viewloom.watchlist.kick.v1
maximum entries: 50 per provider
initial visible entries: 12
```

A stored document contains one provider and an ordered list of normalized entries. Each entry contains:

```text
channelId
optional browser-local displayName
createdAt
```

Rules:

- ids are normalized to lowercase provider-compatible ids;
- provider URLs may be pasted and normalized;
- a URL for the wrong provider is rejected;
- adding an already-saved id does not reorder it;
- duplicate ids are not created;
- list order is browser-local and user-controlled;
- storage is read and written only in the browser;
- no saved id or display name is uploaded to ViewLoom;
- no fallback to cookies, sessionStorage, IndexedDB, D1, KV, or R2 is permitted;
- same-origin storage events update another open tab;
- corrupted documents are recoverable;
- invalid entries may be removed with `Some invalid saved entries were removed.`;
- unavailable or failed storage uses `Changes cannot be saved in this browser.`;
- provider clear and reset operations never modify the other provider key.

No current legacy schema exists.

## 4. URL and metadata contract

The only Watchlist state allowed in the URL is:

```text
period=7d|30d
```

The clean default is 30 days and does not require a query parameter.

Saved ids, filter text, expanded state, and ordering are not serialized into the URL. Keys such as `id`, `name`, `filter`, `saved`, `order`, and `expanded` are removed by the Watchlist URL-state layer.

Metadata remains static and provider-specific:

```text
Twitch title: Twitch Local Watchlist — ViewLoom
Kick title: Kick Local Watchlist — ViewLoom
robots: noindex,follow
canonical: exact provider Watchlist route
og:url: exact provider Watchlist route
```

No channel id or local list contents are added to analytics URLs, canonical URLs, Open Graph data, share metadata, page titles, or descriptions.

## 5. Data sources

Local Watchlist reuses existing provider endpoints only.

Latest observation:

```text
Twitch: /api/twitch-heatmap
Kick:   /api/kick-heatmap
Heatmap requests: exactly 1 for one through fifty valid saved entries
```

Retained History:

```text
Twitch: /api/history?period=<7d|30d>&metric=viewer_minutes
Kick:   /api/kick-history?period=<7d|30d>&metric=viewer_minutes
```

No Watchlist-specific server API is required or allowed for v1.

The page builds one normalized lookup index from each provider response. There is no per-channel request loop.

## 6. Request contract

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined refresh:               1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

The period change performs exactly one new provider History request when that period is not cached. A cached Back/Forward period restore performs zero new requests.

One through fifty saved entries have identical initial request counts.

Task-local operations include add, remove, move, filter, Show all, Show recent, clear, reset, repair, and same-origin storage refresh.

The latest and retained controllers maintain independent page-memory caches. Concurrent requests for the same source and period are deduplicated.

No interval polling, background refresh, service worker monitoring, or page-hidden polling is allowed.

## 7. Latest-observation evidence

Normalized states:

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

Exact labels:

```text
In latest observed set
In latest available observed set
Provider data is stale
Not in latest observed set
Not confirmed offline
Latest observation unavailable
```

When available, latest facts may include viewers, observed timestamp, title, and momentum.

Absence from a bounded provider result is not proof that a channel is offline. Empty or unusable provider responses must not become an absence claim.

## 8. Retained-History evidence

Normalized states:

```text
present_retained
absent_usable
history_partial
history_unavailable
```

Exact labels:

```text
Present in retained History result
Not in retained History result
No complete history is implied
Retained History is partial
Retained History unavailable
```

When available, retained facts may include viewer-minutes, peak viewers, average viewers, observed time, retained daily appearance count, most recent retained appearance, and bounded viewer-minute rank.

A partial History payload must use `Retained History is partial` and must not support a complete presence or absence conclusion. An absent usable result must retain `No complete history is implied`.

## 9. Independent evidence and failure isolation

Latest observation and retained History are separate evidence axes.

- a latest failure must not remove retained evidence;
- a History failure must not remove latest evidence;
- source-specific retry requests only the failed source;
- loading one source must not erase a usable snapshot from the other source;
- no combined status may imply more certainty than either source provides.

## 10. Watchlist page behavior

The page provides:

- provider-specific local-storage disclosure;
- saved count, selected period, storage state, storage key, source state, and request summary;
- add by provider id or provider URL;
- local filter;
- Show all / Show recent;
- clear with confirmation;
- recoverable corrupted-storage reset;
- 7-day and 30-day period controls;
- Refresh data;
- Retry latest;
- Retry History;
- ordered evidence cards;
- provider external link;
- Open Channel;
- Open History;
- Open Heatmap;
- Move up;
- Move down;
- Remove.

The initial unfiltered view shows at most twelve entries. Filtering and Show all reveal matching entries without data requests.

Clear and reset are destructive and require confirmation. Remove remains visually separated from navigation links.

## 11. Channel entry point

Provider Channel pages provide:

```text
Save to Watchlist
Saved in Watchlist
Watchlist unavailable
No data request was made.
```

A valid unsaved channel can be saved to the provider-specific localStorage key with zero additional data requests. A saved channel provides a management link to the provider Watchlist. The saved action is not a remove toggle. Invalid ids and unavailable storage disable the action. Saving one provider never modifies the other provider key.

## 12. Provider Home entry point

Each provider Home exposes Local Watchlist as a secondary browser utility with a provider-specific route and local-storage disclosure. It is not part of the primary analysis-card sequence.

## 13. Responsive and accessibility contract

Required acceptance sizes:

```text
desktop: 1440px
tablet: 820px
mobile: 390px
narrow mobile: 360px
```

Requirements:

- no page-level horizontal overflow;
- long ids, names, titles, facts, and links wrap safely;
- visible keyboard focus and logical focus order;
- reordered cards restore focus to the moved card heading;
- general touch targets are at least 44px;
- mobile management targets are at least 48px;
- reduced motion, increased contrast, and forced colors remain usable;
- evidence state does not rely on color alone;
- empty, partial, unavailable, corrupted-storage, and long-content states remain readable.

## 14. Privacy and analytics

Local ids remain local. Runtime Watchlist and Channel-save code must not send saved ids through analytics events, canonical or social metadata, background requests, beacon APIs, or server storage.

## 15. Explicit non-goals

Local Watchlist v1 does not provide:

- provider-wide channel directory coverage;
- authoritative online/offline monitoring;
- complete channel history;
- exact session start/end history;
- cross-provider identities, totals, or rankings;
- accounts, login, sync, sharing, or collaborative lists;
- server-side user storage;
- alerts or notifications;
- category or language history;
- polling or background monitoring;
- per-channel requests;
- Watchlist as a primary visualization tab.

## 16. Production acceptance

Permanent record:

```text
docs/operations/watchlist-production-acceptance-2026-06-25.md
```

Accepted evidence:

```text
production SHA: f3e0ee8741e96015c5440df167574b8002fccc0d
production acceptance run: 28166806560
evidence schema: viewloom-watchlist-production-acceptance-v1
result: pass
scenarios: 6 / 6 pass
```

Production acceptance confirmed separate provider bindings, real provider data, Home and Channel entry points, storage separation, exact request counts, honest partial and absence wording, responsive behavior, and zero-request Channel save.

## 17. Scope-change rule

A new specification revision is required before work that adds or changes Watchlist server APIs, D1/KV/R2/account storage, sync, polling, alerts, collectors, retention, endpoint meanings, category/language/session claims, cross-provider identities or totals, primary-tab placement, or per-channel data requests.
