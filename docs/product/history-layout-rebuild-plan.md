# History layout rebuild implementation record

Status: completed implementation plan and permanent milestone record
Roadmap phase: Phase 1B / Phase 1C — completed
Permanent specification: `history-and-trends-spec.md`
Production acceptance: `../operations/history-production-acceptance-2026-06-23.md`
Completed: 2026-06-23

## 1. Goal and result

The History rebuild reorganized the existing Twitch and Kick History functions into a public-quality analysis experience without changing provider data boundaries or inventing new data capabilities.

The accepted task structure is:

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

The work completed through H1–H7 and is deployed in production.

Accepted production SHA:

```text
3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

## 2. Preserved invariants

The completed rebuild preserves:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- current 7-day, 30-day, and supported custom-period behavior;
- Viewer-minutes and Peak viewers metrics;
- selected-day synchronization;
- previous-period semantics and comparability limits;
- calendar coverage semantics;
- report, short-post, share-card, CSV, and JSON output contracts;
- Peak, Battle, Top streamer, and Daily archive data contracts;
- loading, real, partial, stale, empty, missing, demo, and error distinctions;
- provider-safe Day Flow, Battle Lines, and Channel links;
- loaded-payload reuse for copy, share, and downloads;
- ordinary implementation on `work-*` branches and deliberate hosted acceptance on `preview-*` branches.

No H1–H7 step changed D1 schema, collectors, cron schedules, retention, metrics, provider separation, or export schemas.

## 3. Completed sequence

### H0 — documentation and baseline

State: completed.

Result:

- canonical roadmap and schedule established;
- permanent History specification and implementation plan established;
- temporary working-note lifecycle established;
- production desktop/mobile defects documented before implementation;
- implementation did not begin before the governing documents merged.

### H1 — History view-state and shell contract

PR: #390
Merge: `ced6471f9d754919df80c5c47de9ed298658c79a`
State: completed.

Result:

- Overview / Archives / Report & Export state introduced;
- Daily / Peaks / Battles archive state introduced;
- valid provider, period, metric, custom dates, and selected day preserved;
- direct URLs and invalid-state fallback covered;
- Back and Forward restoration covered;
- switching task or archive does not refetch History;
- all existing functions remained reachable.

### H2 — Overview rebuild

PR: #391
Merge: `6fdff2d45d7a0ce6ef90315e01b4b9b06ff9f939`
State: completed.

Result:

- compact header and control hierarchy;
- KPI and coverage summary;
- chart-first Overview;
- selected-day interpretation;
- compact previous-period comparison;
- calendar and Top streamers in the primary analysis flow;
- responsive desktop and mobile ordering;
- no archive or permanently expanded share-card content in Overview.

### H3 — Archives rebuild

PR: #392
Merge: `35b6896c2582a04ccae0b162dc6f15629c7b5084`
State: completed.

Result:

- one archive subview visible at a time;
- Daily bounded to nine visible entries by default;
- Peaks and Battles bounded to ten visible entries by default;
- featured and supporting entry hierarchy;
- shared dark archive surfaces;
- provider-safe deep links;
- Battle evidence language restricted to retained daily aggregates;
- desktop, mobile, and keyboard archive navigation verified.

### H4 — Report & Export consolidation

PR: #393
Merge: `afd8f135f5a741bd44108c3f9a8b6f91afc8e50a`
State: completed.

Result:

- Full report and Short post unified under one mode control;
- share-card preview made on demand;
- Copy, PNG, CSV, and JSON actions consolidated;
- status and limitation language kept in one workspace;
- outputs reuse the loaded provider response;
- missing CSV values remain blank and missing JSON values remain null;
- desktop and mobile actions verified.

### H5 — visual system and responsive pass

PR: #394
Merge: `c0df355df732cde1775452c90431da32b8837aeb`
State: completed.

Result:

- final cross-view visual layer introduced;
- shared dark card and section hierarchy;
- readable typography and spacing;
- visible keyboard focus;
- non-color state symbols;
- long-text wrapping;
- reduced-motion handling;
- desktop, tablet, and 390px mobile reconciliation;
- no page-level horizontal overflow.

### H6 — complete candidate QA

PR: #395
Merge: `7912f8328ff6c163ef9e4296ebbdbcf8f9fde8d8`
State: completed.

Result:

- complete latest-HEAD History and shared-web workflow matrix passed;
- shell, Overview, Archives, Peak, Battle, comparison, report, share, and export regressions passed;
- Data Status and Channel Profile shared regressions passed;
- Twitch/Kick desktop, tablet, and mobile full-page artifacts reviewed;
- Battle keyboard gate stabilized around the supported chart-activation path.

### H7 — Cloudflare Preview, production acceptance, and document cleanup

PR: #396
Production merge: `3cde59cceb09a0c60f48794d6391cf5c356a1b31`
State: completed.

Result:

1. `preview-history-h7` deployed through the configured `preview-*` rule;
2. Preview Pages Functions and separate Twitch/Kick D1 bindings were verified;
3. Preview History APIs returned real retained observations;
4. Twitch desktop and Kick 390px hosted browser acceptance passed;
5. the final candidate merged to `main`;
6. `/deployment.json` reported production, main, and the exact accepted SHA;
7. the temporary H7 marker returned the explicit production 404 page;
8. public Twitch/Kick History browser acceptance passed;
9. production artifacts were reviewed;
10. stable decisions moved into permanent documentation;
11. the temporary working note and milestone-specific acceptance files were retired.

Preview evidence:

```text
workflow run: 27998433929
```

Production evidence:

```text
workflow run: 27999024838
artifact id: 7810348478
```

## 4. Accepted browser and artifact matrix

Repository candidate:

- Twitch desktop Overview;
- Twitch desktop Archives;
- Twitch desktop Report & Export;
- Kick desktop Overview and Archives;
- Twitch tablet Report & Export with reduced motion;
- Twitch and Kick mobile task switching and archives;
- keyboard task, archive, focus, calendar, and battle activation;
- shared Status and Channel links.

Hosted Preview:

- real Twitch History API;
- real Kick History API;
- Twitch desktop task/archive/report flow;
- Kick 390px task/archive/report flow;
- visible archive bounds;
- touch target and overflow checks;
- full-page screenshot review.

Production:

- exact deployment identity;
- public History routes;
- public marker absence and explicit 404 behavior;
- real retained-data APIs;
- Twitch desktop full-page acceptance;
- Kick 390px full-page acceptance.

## 5. Stable implementation decisions

- Overview remains the canonical default URL.
- View and archive state live in URL-compatible state and support Back/Forward.
- Task switching is client-side over one loaded History payload.
- Top streamers belongs in Overview.
- Previous-period comparison remains secondary to the chart.
- Daily, Peaks, and Battles are separated and bounded.
- Daily cards may remain in the DOM while hidden by accepted visibility controls; the default visible set remains bounded.
- Battle archive keyboard activation targets the matching chart day and does not depend on a URL change when the same day is already selected.
- Report and export tools remain one secondary workspace.
- Share-card drawing remains on demand.
- output formats preserve provider, period, coverage, source, and missing-value semantics.
- visual focus, state, and selected treatment do not rely on color alone.
- mobile is an ordered one-column product layout, not a scaled desktop page.

## 6. Boundaries for future changes

Future History changes must not be added to this completed milestone unless they are verified defects in accepted behavior.

Separate roadmap/specification work is required for:

- new metrics;
- new archive types;
- D1 or collector changes;
- session reconstruction;
- category or language trends;
- cross-platform comparison;
- login, Watchlist, Alerts, or AI interpretation;
- additional report modes;
- density-increasing sections.

## 7. Rollback and maintenance principle

The rebuild remains logically traceable through PRs #390–#396. Permanent regression gates cover the accepted task shell, Overview, Archives, Peak, Battle, comparison, visual/responsive behavior, and shared links.

Maintenance changes must:

- reproduce the defect;
- preserve provider and data honesty invariants;
- add or update the narrowest permanent gate;
- pass the complete affected workflow matrix;
- use deliberate Preview and production acceptance when runtime behavior changes.

This plan is complete and is retained as the implementation record. It is not an active queue for additional History features.
