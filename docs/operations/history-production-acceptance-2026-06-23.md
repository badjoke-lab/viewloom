# History production acceptance — 2026-06-23

Status: completed permanent record
Feature: Twitch and Kick History & Trends
Accepted production SHA: `3cde59cceb09a0c60f48794d6391cf5c356a1b31`

## Scope

This record closes the History layout rebuild and hosted acceptance sequence. The work reorganized the existing History functions without changing provider data boundaries, D1 schema, collectors, cron schedules, retention, metrics, or export schemas.

## Implementation sequence

| Step | PR | Merge / accepted SHA | Result |
|---|---:|---|---|
| H1 — view shell and URL state | #390 | `ced6471f9d754919df80c5c47de9ed298658c79a` | completed |
| H2 — Overview rebuild | #391 | `6fdff2d45d7a0ce6ef90315e01b4b9b06ff9f939` | completed |
| H3 — Archives rebuild | #392 | `35b6896c2582a04ccae0b162dc6f15629c7b5084` | completed |
| H4 — Report & Export | #393 | `afd8f135f5a741bd44108c3f9a8b6f91afc8e50a` | completed |
| H5 — visual and responsive pass | #394 | `c0df355df732cde1775452c90431da32b8837aeb` | completed |
| H6 — complete candidate QA | #395 | `7912f8328ff6c163ef9e4296ebbdbcf8f9fde8d8` | completed |
| H7 — Preview and production acceptance | #396 | `3cde59cceb09a0c60f48794d6391cf5c356a1b31` | completed |

## Accepted product structure

History uses three task views:

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

Stable behavior:

- Overview is the default clean URL and primary analysis surface.
- Task and archive state preserve provider, period, metric, supported dates, and selected day.
- Back and Forward navigation restore History state.
- Task switching does not fetch another History payload.
- Only one archive subview is visible at a time.
- Daily is bounded to nine visible entries by default.
- Peaks and Battles are bounded to ten visible entries by default.
- Battle archive language remains daily-aggregate and does not invent exact reversal times.
- Full report and Short post share one mode control.
- Share-card rendering is on demand.
- Copy, PNG, CSV, and JSON actions remain in one workspace and reuse the loaded provider response.
- Twitch and Kick remain fully separated in routes, APIs, D1 bindings, links, output text, and filenames.

## Candidate verification

The final candidate passed the complete History and shared-web workflow matrix, including:

- build, type, policy, naming, and public-readiness checks;
- History shell and integrated browser checks;
- Overview, Archives, Peak, Battle, and period-comparison checks;
- H5 four-viewport visual/responsive browser checks;
- shared Data Status and Channel Profile regressions;
- keyboard focus, archive keyboard activation, reduced motion, long-text wrapping, and 390px overflow checks.

## Cloudflare Preview acceptance

Preview branch:

```text
preview-history-h7
```

Preview URL:

```text
https://preview-history-h7.viewloom.pages.dev
```

Verified:

- Pages Functions executed on the configured Preview deployment;
- Twitch and Kick used separate Preview D1 bindings;
- both History APIs returned `source: real` with retained observed days and Top streamers;
- Twitch desktop and Kick 390px task views worked with real Preview data;
- archive bounds, Report & Export actions, touch targets, and page-level overflow passed;
- full-page artifacts were reviewed.

Final hosted Preview workflow run:

```text
27998433929
```

## Production acceptance

The production acceptance gate waited until `/deployment.json` reported all of the following:

```text
environment = production
branch      = main
commit_sha  = 3cde59cceb09a0c60f48794d6391cf5c356a1b31
```

It then verified:

- `/twitch/history/` and `/kick/history/` returned the ViewLoom application;
- the temporary H7 Preview marker returned the explicit ViewLoom 404 page;
- Twitch and Kick History APIs returned real retained data;
- Twitch desktop History passed task, archive, report, export, and overflow checks;
- Kick 390px History passed task, archive, report, export, touch-target, and overflow checks;
- production full-page artifacts were reviewed.

Production acceptance workflow run:

```text
27999024838
```

Production artifact:

```text
history-h7-production-artifacts
artifact id: 7810348478
```

## Final visual acceptance

Twitch desktop:

- History header, period, metric, state, and observed scope were clear;
- Report & Export formed one coherent secondary workspace;
- output actions were distinct and readable;
- real retained-data and limitation language remained visible.

Kick mobile at 390px:

- controls and task tabs wrapped without page-level horizontal overflow;
- the publishing workspace became one readable column;
- action buttons met the intended touch size;
- long report text and status rows wrapped inside their containers.

## Closure

History layout rebuild and production acceptance are complete. The temporary History working note, milestone-specific Preview workflow, hosted acceptance script, and H7 acceptance note are removed in the documentation cleanup PR. Channel / Streamer v1 becomes the next major product phase, subject to the current roadmap and schedule.
