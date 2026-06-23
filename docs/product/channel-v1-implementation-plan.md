# ViewLoom Channel / Streamer v1 implementation record

Status: completed implementation plan and permanent milestone record
Version: 1.0-complete
Last updated: 2026-06-23
Roadmap phase: Phase 3 — Channel / Streamer v1 completed
Permanent specification: `channel-and-streamer-spec.md`
Production acceptance: `../operations/channel-production-acceptance-2026-06-23.md`
Accepted production SHA: `efc14295f0a372b96afac740d6a01571f7582210`
Closure PR: #408

## 1. Goal

Turn the existing minimal provider-specific Channel footprint into a coherent retained-observation product without inventing session history or changing the data backbone.

Accepted task structure:

```text
Overview
Retained Days
Report & Export
```

The implementation uses one provider History request per period load and derives all task models from that response.

## 2. Invariants preserved

Every implementation and acceptance step preserved:

- separate Twitch and Kick routes and API calls;
- exactly one History request per period load;
- no request when channel id is missing;
- no cross-provider output, link, report, export, or filename;
- absence means `Not in retained daily Top 10`, not offline;
- no exact session claim;
- missing values remain unavailable rather than zero;
- task switching, day selection, copy, CSV, and JSON reuse the loaded response;
- no D1, binding, collector, cron, retention, or History API change;
- hosted validation uses deliberate `preview-*` branches rather than ordinary `work-*` branches.

## 3. Completed PR sequence

### C0 — current implementation and real production audit

```text
PR #398
merge SHA: e7929a48a736a60f8439f4747a0b18118181358b
production baseline run: 28004912659
production baseline artifact: 7812384078
```

Completed:

- recorded existing Twitch/Kick routes, payloads, styles, and gates;
- fixed supported and unsupported retained-data claims;
- captured real Twitch desktop and Kick 390px baselines;
- identified the unbounded 30-day Kick mobile archive defect;
- introduced no runtime behavior change.

### C1 — permanent specification and implementation plan

```text
PR #399
```

Completed:

- fixed purpose, task structure, provider separation, URL state, archive bound, rivalry order, exports, SEO, responsive behavior, and acceptance rules;
- established `work-channel-c2-state` as the first runtime branch;
- kept the C0 note temporary through implementation.

### C2A — state, URL, payload, and one-request foundation

```text
PR #400
```

Completed:

- added focused Channel model, state, URL, payload, and selector modules;
- normalized provider, id, name, period, task, and selected day;
- defaulted period to 30d;
- restored Back/Forward state;
- preserved missing-id no-request behavior;
- made period changes fetch once and task/day changes reuse the payload.

### C2B — task shell and evidence header

```text
PR #401
```

Completed:

- added Overview / Retained Days / Report & Export navigation;
- showed one task at a time;
- exposed provider, period, source/state, observed scope, retained appearances, and session limitation near the top;
- added Copy current URL and keyboard/focus contracts;
- added `noindex,follow` to dynamic Channel pages.

### C3 — Overview and selected-day interpretation

```text
PR #402
```

Completed:

- established primary Viewer-minutes / Peak viewers hierarchy;
- separated Average viewers, Observed time, and retained days as supporting facts;
- rebuilt 7-day and 30-day daily footprint;
- separated retained, absent, missing, and partial states;
- added keyboard/touch selected-day interpretation;
- bounded recent retained-day and rivalry previews to three.

### C4A — bounded Retained Days and deterministic rivalry

```text
PR #403
PR #404 rivalry tie-break correction
```

Completed:

- moved the full daily archive into Retained Days;
- defaulted to six visible cards;
- added Show all / Show recent and visible counts;
- preserved newest-first ordering;
- synchronized selected day without nested-link double activation;
- fixed rivalry order to score, day, gap, then stable id;
- preserved provider-safe Day Flow and Battle Lines links.

### C4B — Report & Export

```text
PR #405
```

Completed:

- added Full summary and Short post;
- added Copy summary;
- added daily CSV and structured JSON;
- preserved source, state, coverage, missing-value, and limitation semantics;
- used provider/channel/period filenames;
- prevented copy and export from triggering another History request.

### C5A — visual, responsive, accessibility, and candidate QA

```text
PR #406
main before hosted acceptance: 27fdfba6f5a451d15dd86f5cc5918db2a3c7c598
```

Completed:

- applied the accepted dark surface hierarchy;
- separated primary and supporting fact scale;
- reconciled desktop, tablet, 390px, and 360px layouts;
- added mobile touch sizing, focus, non-color state, reduced-motion, and long-text behavior;
- passed Channel and affected History, Status, naming, build, and policy gates;
- reviewed provider-specific candidate artifacts.

### C5B — Preview, production acceptance, and closure

```text
PR #407 Preview acceptance merge
accepted main SHA: efc14295f0a372b96afac740d6a01571f7582210
PR #408 production acceptance and closure
```

Preview:

```text
branch: preview-channel-v1
candidate SHA: 7feff50bb7233f029e775f764af03bf0c683e941
run: 28027105615
artifact: 7821161692
```

Production:

```text
accepted SHA: efc14295f0a372b96afac740d6a01571f7582210
run: 28028685856
artifact: 7821826483
```

Completed:

- verified separate Preview Twitch/Kick bindings with real retained data;
- selected real channels independently per provider;
- passed Twitch desktop and Kick 390px browser acceptance;
- verified exact production SHA through `/deployment.json`;
- passed public Twitch/Kick task, archive, report, copy, CSV, JSON, provider, request-count, touch, and overflow contracts;
- transferred stable evidence into permanent documentation;
- retired milestone-only acceptance files and the C0 working note.

## 4. Accepted architecture

Public entry points remain:

```text
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
apps/web/src/live/channel-profile.ts
apps/web/src/channel-profile.css
```

Focused modules live under:

```text
apps/web/src/live/channel/
```

The page derives:

- period summary from matching `topStreamers[]`;
- one daily state per requested day from `daily[]`;
- retained archive entries from matching daily rows;
- rivalry candidates from matching `battleArchive[]` entries;
- evidence state from provider `source`, `state`, and `coverage`.

## 5. Accepted request lifecycle

### Initial load

```text
parse URL
validate provider/id/period/view/day
if id missing -> render missing-id state, no request
else -> fetch one provider History response
render all task models from that response
```

### Task or selected-day change

```text
update URL and visible task/selection
reuse loaded models
no fetch
```

### Period change

```text
abort previous request
update period and URL
fetch once
validate selected day
render all task models
```

### Back / Forward

```text
parse restored URL
reuse payload when only task/day changed
fetch once when period changed
never cross provider or id silently
```

## 6. Accepted output contracts

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

JSON top level:

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

Missing CSV numeric values remain blank. Missing JSON numeric values remain `null`.

## 7. Permanent acceptance evidence

```text
docs/operations/channel-production-acceptance-2026-06-23.md
```

The permanent record contains the exact production revision, Preview and production run ids, artifact ids, real provider/channel evidence, filenames, request counts, and manual visual review result.

## 8. Completion result

This plan is complete and retained as the implementation record.

Future Channel changes are maintenance unless the roadmap and permanent specification approve a new scope. Session, category/language, Watchlist, Alerts, and other major expansions require the later data-capability audit.

History UI appearance work remains a separate pending item and was not changed by Channel C0–C5B.
