# ViewLoom Channel / Streamer v1 implementation plan

Status: active implementation plan
Version: 1.0
Last updated: 2026-06-23
Roadmap phase: Phase 3 — Channel / Streamer v1
Permanent specification: `channel-and-streamer-spec.md`
Active working note: `../work-in-progress/channel-v1-audit.md`
C0 audit merge: `e7929a48a736a60f8439f4747a0b18118181358b`

## 1. Goal

Turn the existing minimal provider-specific Channel footprint into a coherent v1 product without inventing session history or changing the data backbone.

Accepted task structure:

```text
Overview
Retained Days
Report & Export
```

The implementation keeps one provider History request and progressively reorganizes state, rendering, archive visibility, rivalry evidence, copy, and export.

## 2. Starting point

Existing routes:

```text
/twitch/channel/?id=<streamer-id>
/kick/channel/?id=<streamer-id>
```

Existing implementation:

```text
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
apps/web/src/live/channel-profile.ts
apps/web/src/channel-profile.css
apps/web/src/navigation/channel-profile-link.ts
apps/web/scripts/verify-channel-profile.mjs
apps/web/scripts/channel-profile-browser.mjs
.github/workflows/channel-profile.yml
.github/workflows/channel-profile-browser.yml
apps/web/docs/channel-profile-minimal-contract.md
```

Current data source:

```text
Twitch -> /api/history
Kick   -> /api/kick-history
```

C0 production evidence:

```text
workflow run: 28004912659
artifact id:  7812384078
```

Primary verified defect:

```text
30-day Kick mobile rendered 17 retained-day cards at once.
```

## 3. Invariants

Every PR must preserve:

- separate Twitch and Kick routes and API calls;
- exactly one History request per period load;
- no request when channel id is missing;
- no cross-provider output or filename;
- absence is `Not in retained daily Top 10`, not offline;
- no exact session claims;
- missing numeric values are unavailable, not zero;
- task switching, copy, CSV, and JSON reuse the loaded response;
- no D1, collector, cron, retention, or History API change unless the roadmap and specification are amended first;
- `work-*` implementation branches do not receive Cloudflare Preview deployments;
- hosted runtime acceptance uses a deliberate `preview-*` branch.

## 4. Planned module shape

Keep the public entry file stable while moving responsibilities into focused modules.

```text
apps/web/src/live/channel-profile.ts
apps/web/src/live/channel/
  model.ts
  constants.ts
  state.ts
  url-state.ts
  payload.ts
  selectors.ts
  controller.ts
  overview.ts
  trend.ts
  selected-day.ts
  retained-days.ts
  rivalry.ts
  report.ts
  export-csv.ts
  export-json.ts
  status.ts
  dom.ts
```

Styles:

```text
apps/web/src/channel-profile.css
```

The CSS may later split when a stable boundary is clear, but C2 first reformats and documents the existing stylesheet rather than moving all styles at once.

## 5. PR sequence

### C1 — permanent specification and implementation plan

Branch:

```text
work-channel-c1
```

Scope:

- add the permanent Channel specification;
- add this implementation plan;
- link both from the documentation index;
- update the schedule from C0 to C1 completed / C2 next;
- update the policy verifier;
- keep the C0 audit note active through implementation.

No runtime change.

Completion:

- scope, non-goals, state, URL, archive bound, rivalry order, exports, SEO, responsive behavior, and acceptance are fixed;
- first implementation PR is unambiguous.

### C2A — module and state foundation

Suggested branch:

```text
work-channel-c2-state
```

Scope:

- add Channel model, constants, payload, selectors, and state modules;
- parse and normalize provider, id, name, period, view, and day;
- default period to 30d;
- normalize Overview to a clean URL;
- add `popstate` restoration;
- retain one request per period load;
- preserve missing-id no-request behavior;
- add unit/static contract tests for valid and invalid URL state;
- keep the visible page close to the current layout.

Required state:

```ts
type ChannelView = 'overview' | 'days' | 'report'
type ChannelPeriod = '7d' | '30d'

type ChannelState = {
  provider: 'twitch' | 'kick'
  channelId: string
  requestedName: string
  period: ChannelPeriod
  view: ChannelView
  selectedDay?: string
}
```

Completion:

- direct links restore state;
- invalid state falls back safely;
- Back/Forward works;
- task changes do not fetch;
- period changes fetch exactly once;
- existing fixture browser checks remain green.

### C2B — task shell and shared header

Suggested branch:

```text
work-channel-c2-shell
```

Scope:

- add Overview / Retained Days / Report & Export task navigation;
- show one task at a time;
- reorganize hero facts into provider, period, source/state, observed days, retained appearances, and session limitation;
- retain provider-specific external link;
- add Copy current URL;
- add keyboard and focus contracts;
- add `noindex,follow` metadata to Twitch and Kick Channel pages;
- keep all existing data reachable.

Completion:

- task shell works at desktop and 390px;
- header exposes data evidence near the top;
- no duplicate History request;
- missing-id and error state remain operable.

### C3 — Overview and selected-day interpretation

Suggested branch:

```text
work-channel-c3-overview
```

Scope:

- establish primary Viewer-minutes / Peak viewers hierarchy;
- place Average viewers, Observed time, and retained days as supporting facts;
- rebuild daily footprint for readable 7-day and 30-day display;
- distinguish retained, absent, missing, and partial days;
- thin date labels on mobile;
- make trend days keyboard/touch selectable;
- add selected-day interpretation;
- preview at most three recent retained days;
- preview at most three rivalry candidates;
- add compact empty-rivalry state.

Completion:

- Overview answers the main retained-footprint question without scrolling through the full archive;
- 30-day trend is readable at 390px;
- absence is never rendered as real zero;
- selected day synchronizes trend, URL, and links.

### C4A — bounded Retained Days and deterministic rivalry

Suggested branch:

```text
work-channel-c4-days-rivals
```

Scope:

- move all retained-day cards into the Retained Days task;
- default to six visible entries;
- add Show all / Show recent;
- show visible and total counts;
- preserve newest-first order;
- synchronize card selection with selected-day state;
- prevent nested links from double activation;
- sort rivalry candidates by score, date, gap, then stable id;
- enforce provider-safe Day Flow and Battle Lines links;
- add empty retained-footprint copy.

Completion:

- 30-day mobile starts with at most six cards;
- expansion is explicit and reversible;
- no page-level overflow;
- rivalry order is deterministic and documented.

### C4B — Report & Export

Suggested branch:

```text
work-channel-c4-report-export
```

Scope:

- add Full summary and Short post modes;
- add Copy summary;
- add daily CSV export;
- add structured JSON export;
- reuse the loaded payload only;
- preserve provider/source/state/coverage and limitation language;
- use blank missing numeric CSV cells and JSON `null`;
- use provider/channel/period filenames;
- add success/error status feedback;
- cover escaping, long names, missing rows, empty rivalry, and demo data.

Completion:

- outputs match the permanent schema;
- no export triggers a network request;
- Twitch output contains no Kick references and vice versa;
- missing is never exported as observed zero.

### C5A — visual, responsive, accessibility, and complete candidate QA

Suggested branch:

```text
work-channel-c5-candidate
```

Scope:

- reformat and rationalize Channel CSS;
- replace disabled-looking light cards with accepted dark surfaces;
- establish primary/supporting fact hierarchy;
- reconcile desktop, tablet, 390px, and 360px layouts;
- verify 48px mobile actions where practical;
- add focus, non-color states, reduced motion, and long-text wrapping;
- run all Channel static/browser gates plus affected History, Status, naming, build, and policy gates;
- save Twitch/Kick desktop/mobile artifacts;
- review full-page screenshots.

Completion:

- latest candidate HEAD is fully green;
- no page-level horizontal overflow;
- mobile is not a scaled desktop page;
- C0 defects are visibly resolved;
- artifacts show all three tasks.

### C5B — Cloudflare Preview, production acceptance, and documentation closure

Suggested branches:

```text
work-channel-c5-acceptance
preview-channel-v1
```

Scope:

1. create a deliberate `preview-channel-v1` branch from the exact candidate;
2. verify Preview Pages Functions and separate Twitch/Kick Preview D1 bindings;
3. select real retained channels from Preview History APIs;
4. run Twitch desktop and Kick 390px browser acceptance;
5. review full-page artifacts;
6. merge the candidate to main;
7. wait for exact `/deployment.json` SHA;
8. run public Twitch/Kick Channel smoke and browser acceptance;
9. record run ids, artifact ids, and accepted SHA permanently;
10. update roadmap and schedule;
11. delete milestone-only acceptance files;
12. delete and unlink the temporary Channel audit note.

Completion:

- exact production revision is verified;
- public task, archive, report, export, provider, state, and overflow contracts pass;
- the temporary note no longer exists;
- the next roadmap phase is explicit.

## 6. Detailed state and request rules

### Initial load

```text
parse URL
validate provider/id/period/view/day
if id missing -> render missing-id state, no request
else -> fetch one provider History response
render all task models from that response
```

### Task switch

```text
update URL and task visibility
reuse loaded models
no fetch
```

### Period switch

```text
abort previous request
update period and URL
fetch once
validate selected day against new period
render all task models
```

### Back / Forward

```text
parse restored URL
if only view/day changed -> reuse payload
if period changed -> fetch once
never cross provider or id silently
```

## 7. Derived model rules

Period summary:

- use the matching `topStreamers` row;
- unavailable values remain unavailable;
- do not sum daily Top 10 rows and call the result complete provider history unless the payload contract explicitly says so.

Daily model:

- one entry per requested provider day;
- attach matching streamer row when present;
- preserve day coverage state independently from channel presence;
- represent absence, missing day, and partial day separately.

Rivalry model:

- keep entries involving the selected channel only;
- normalize opponent id/name;
- retain day-only precision;
- sort deterministically;
- do not infer exact reversal time.

## 8. Export details

CSV columns:

```text
provider
channel_id
display_name
period
day
retained_top10
coverage_state
viewer_minutes
peak_viewers
avg_viewers
observed_minutes
rank_by_viewer_minutes
```

JSON top-level fields:

```text
schema: viewloom-channel-v1
provider
channel
period
source
state
coverage
summary
daily
rivalry_candidates
limitations
```

Sanitization:

- escape CSV cells;
- strip unsafe filename characters;
- preserve Unicode display names inside content;
- use normalized provider id in filenames;
- escape all user-controlled display fallback in DOM and text output.

## 9. Gate plan

Static gates:

- Channel route and provider separation;
- URL state normalization;
- one-request contract;
- task visibility;
- daily-state derivation;
- archive default six;
- rivalry ordering;
- report copy;
- CSV and JSON schemas;
- metadata `noindex,follow`.

Browser gates:

- Twitch ranking deep link;
- task switching without new request;
- period switch with one request;
- Back/Forward;
- selected day;
- Show all / Show recent;
- copy and downloads;
- missing-id no request;
- empty retained footprint;
- partial and demo labels;
- provider-safe links;
- 1440, 768, 390, and 360 widths;
- keyboard and focus;
- no page overflow.

Shared regressions:

- History ranking links;
- History API payload contract;
- Data Status links and state language;
- platform naming;
- production readiness and deployment identity.

## 10. Estimated execution

| Step | Estimated work |
|---|---:|
| C1 documentation | 1 workday |
| C2A state foundation | 1–2 workdays |
| C2B task shell | 1–2 workdays |
| C3 Overview | 2–3 workdays |
| C4A days/rivalry | 1–2 workdays |
| C4B report/export | 1–2 workdays |
| C5A visual/candidate QA | 2 workdays |
| C5B hosted/production closure | 1–2 workdays |

Expected total:

```text
10–15 focused workdays
7 implementation/acceptance PRs after C1
```

PR count may increase when a responsibility proves too large. It must not be reduced by mixing data, state, rendering, export, and acceptance into one unreviewable change.

## 11. Rollback principle

Each runtime PR must be independently revertible.

- C2 state changes must not depend on C3 visuals to preserve current output.
- C3 Overview must not remove retained-day access before C4 archive exists.
- C4 report/export must remain secondary and removable without breaking analysis.
- C5 visual changes must not alter payload semantics.
- hosted acceptance files remain milestone-only and are deleted after permanent evidence transfer.

## 12. First executable step after C1

```text
Create work-channel-c2-state from the merged C1 main revision.
Implement URL/state modules, popstate restoration, and the one-request task contract without redesigning the visible page.
```
