# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-23

This schedule reflects the verified repository and production state. Earlier windows that treated History or the Channel audit as future work are historical and no longer control execution.

## 1. Scheduling rules

- Phase order matters more than calendar dates.
- P0 production failures interrupt the schedule immediately.
- P1 defects interrupt the active phase when they block acceptance.
- P2 polish is grouped unless it belongs to the active milestone.
- GitHub merge status alone does not complete a runtime phase.
- Runtime completion requires repository checks, browser checks, required Preview validation, exact production deployment identity, and public verification.
- Every implementation PR cites the roadmap phase, permanent specification, implementation plan, and active working note.
- `work-*` branches are ordinary implementation branches and do not receive Cloudflare Preview deployments.
- deliberate hosted validation uses an approved `preview-*` branch.

## 2. Current position

```text
Cloudflare production cutover        complete
Twitch/Kick D1 binding verification  complete
Collector freshness verification     complete
Core v1 production deployment        complete
History functional expansion         complete
History layout rebuild H1–H6         complete
History Preview acceptance H7        complete
History production acceptance H7     complete
History temporary-note lifecycle     complete
Channel C0 audit                      complete through PR #398
Channel C1 specification             active in work-channel-c1
```

Accepted History production SHA:

```text
3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

Current main before the C1 documentation PR:

```text
e7929a48a736a60f8439f4747a0b18118181358b
```

Current active phase:

```text
Phase 3 — Channel / Streamer v1
C1 — permanent specification and implementation plan
```

Next executable runtime step after C1 merge:

```text
C2A — Channel state, URL, popstate, and one-request foundation
branch: work-channel-c2-state
```

## 3. Completed History execution record

### H0–H7

State: completed.

Permanent records:

```text
docs/product/history-and-trends-spec.md
docs/product/history-layout-rebuild-plan.md
docs/operations/history-production-acceptance-2026-06-23.md
```

Accepted result:

- Overview / Archives / Report & Export task model;
- provider-specific Twitch and Kick History;
- complete candidate matrix;
- deliberate Cloudflare Preview verification;
- exact production SHA acceptance;
- temporary-note retirement.

## 4. Channel execution window

Permanent governing documents:

```text
docs/product/channel-and-streamer-spec.md
docs/product/channel-v1-implementation-plan.md
```

Active temporary evidence and implementation note:

```text
docs/work-in-progress/channel-v1-audit.md
```

### C0 — current implementation and data audit

State: completed through PR #398.

Merge SHA:

```text
e7929a48a736a60f8439f4747a0b18118181358b
```

Production baseline evidence:

```text
workflow run: 28004912659
artifact id:  7812384078
```

Completed criteria:

- current Twitch/Kick routes, files, API path, payload fields, styles, and gates recorded;
- supported and unsupported retained-observation claims fixed;
- provider separation and absence/session honesty rules fixed;
- real Twitch desktop and Kick 390px production baselines captured;
- primary mobile defect identified: 17 retained Kick days expanded by default;
- no Channel runtime behavior changed.

### C1 — Channel permanent specification and implementation plan

State: active; completes when the C1 documentation PR merges green.

Branch:

```text
work-channel-c1
```

Deliverables:

- permanent Channel / Streamer v1 specification;
- accepted `Overview / Retained Days / Report & Export` task structure;
- URL, period, selected-day, state, provider, and request contracts;
- retained-day default bound of six;
- deterministic rivalry ordering;
- copy, CSV, and JSON contracts;
- `noindex,follow` rule for query-based dynamic identities;
- responsive, accessibility, Preview, production, and cleanup acceptance matrix;
- seven-step implementation/acceptance PR plan.

Completion criteria:

- scope and non-goals are fixed;
- retained observation language is explicit;
- first runtime branch and completion tests are unambiguous;
- docs index and policy verifier require the permanent documents;
- full documentation-triggered workflow matrix is green.

### C2A — module and state foundation

State: queued immediately after C1.

Target: 1–2 focused workdays.

Branch:

```text
work-channel-c2-state
```

Scope:

- add focused Channel model/state/URL/payload modules;
- parse provider, id, name, period, view, and selected day;
- default period to 30d;
- normalize Overview to the clean URL;
- add Back/Forward restoration;
- preserve missing-id no-request behavior;
- make task/day state reuse the loaded payload;
- make period changes perform exactly one provider History request;
- avoid visible redesign in this state-foundation PR.

Completion criteria:

- direct links and invalid-state fallback pass;
- Back/Forward passes;
- task/day changes do not fetch;
- period changes fetch once;
- Twitch/Kick remain separated;
- existing Channel browser contract remains green.

### C2B — task shell and evidence header

State: queued.

Target: 1–2 focused workdays.

Scope:

- add Overview / Retained Days / Report & Export navigation;
- show one task at a time;
- expose provider, period, source/state, observed scope, retained appearances, and session limitation near the top;
- add Copy current URL;
- add keyboard/focus contract;
- add `noindex,follow` metadata;
- keep all existing data reachable.

### C3 — Overview and selected-day interpretation

State: queued.

Target: 2–3 focused workdays.

Scope:

- primary Viewer-minutes / Peak viewers hierarchy;
- supporting Average viewers / Observed time / retained-day count;
- readable 7-day and 30-day retained trend;
- retained / absent / missing / partial distinction;
- selected-day interpretation and provider-safe links;
- maximum three recent-day and three rivalry previews;
- compact empty-rivalry state.

### C4A — bounded Retained Days and rivalry

State: queued.

Target: 1–2 focused workdays.

Scope:

- move the complete daily archive into Retained Days;
- default to six visible entries;
- add Show all / Show recent and counts;
- preserve newest-first order;
- synchronize selected day;
- prevent nested-link double activation;
- sort rivalry candidates by score, day, gap, and stable id;
- preserve daily-aggregate evidence language.

### C4B — Report & Export

State: queued.

Target: 1–2 focused workdays.

Scope:

- Full summary / Short post;
- Copy summary;
- provider-specific CSV and JSON;
- loaded-payload reuse;
- blank CSV / null JSON missing values;
- provider/channel/period filenames;
- no PNG in Channel v1.

### C5A — visual, responsive, accessibility, and candidate QA

State: queued.

Target: 2 focused workdays.

Scope:

- accepted ViewLoom dark surface hierarchy;
- primary/supporting fact hierarchy;
- desktop, tablet, 390px, and 360px reconciliation;
- mobile touch sizes and long-text wrapping;
- keyboard, focus, non-color states, and reduced motion;
- complete latest-HEAD Channel and affected shared workflow matrix;
- Twitch/Kick desktop/mobile full-page artifact review.

### C5B — Preview, production, and documentation closure

State: queued.

Target: 1–2 focused workdays.

Preview branch:

```text
preview-channel-v1
```

Completion criteria:

- separate Preview Twitch/Kick bindings verified with real retained data;
- provider-specific desktop/mobile browser acceptance passes;
- exact main deployment SHA verified through `/deployment.json`;
- public Twitch/Kick Channel smoke and browser checks pass;
- permanent acceptance evidence records run and artifact ids;
- roadmap and schedule advance;
- milestone-only acceptance files are deleted;
- the Channel temporary audit note is deleted and unlinked.

## 5. Work after Channel

### Report/export component consolidation

State: blocked by Channel production acceptance.

Scope:

- reuse accepted History and Channel output primitives;
- standardize labels, filenames, coverage copy, status messages, and responsive actions;
- remove duplication without changing data semantics.

### Next-feature data-capability audit

State: blocked by component consolidation.

Candidates:

- Session feasibility;
- Category/Game and Language retention;
- Event layer;
- Watchlist and Alerts;
- one honest Free-plan-compatible expansion.

## 6. Status update format

```text
Phase:
State: queued | active | blocked | completed
Branch / PR:
Completed criteria:
Remaining criteria:
Blockers:
Next executable step:
```

Do not mark a runtime phase complete merely because implementation exists on a branch.
