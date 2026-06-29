# ViewLoom History UI repair specification

Status: accepted and complete
Version: 1.2
Created: 2026-06-25
Last updated: 2026-06-29
Roadmap phase: Phase 9 — History P1 repair complete
Accepted baseline specification: `history-and-trends-spec.md`
Completed implementation plan: `history-ui-repair-plan.md`
Permanent acceptance: `../operations/history-production-acceptance-2026-06-28.md`

## 1. Purpose

This document records the accepted repair target for the public Twitch and Kick History experience. The 2026-06-23 retained-data baseline remains valid, and the Phase 9 repair closes the later verified public-quality defects without changing provider boundaries or retained-data meaning.

## 2. Accepted repair scope

The accepted repair permanently protects:

- Viewer-minutes and Peak viewers across every metric-dependent surface;
- chart scale, UTC date context, unit, baseline, selected day, and exact detail;
- useful Summary and Selected day analysis;
- task-first Overview, Archives, and Report & Export hierarchy;
- pointer, keyboard, and touch inspection;
- desktop, tablet, mobile, reduced-motion, contrast, and forced-color behavior;
- explicit real, partial, stale, empty, missing, demo, error, and in-progress states;
- direct links, Back/Forward, provider separation, request counts, and output schemas.

## 3. Provider and data invariants

History remains provider-specific:

```text
/twitch/history/
/kick/history/
```

Mandatory invariants:

- no combined Twitch/Kick totals or rankings;
- no cross-provider API or D1 query;
- provider-specific labels, accents, links, filenames, report text, and exports;
- bounded observation is never described as provider-wide coverage;
- separate D1 bindings remain unchanged;
- task switching never changes provider;
- copy, share, and download never fetch the other provider;
- provider-origin names, IDs, titles, and categories remain exact.

## 4. Supported primary metrics

```text
viewer_minutes
peak_viewers
```

No additional primary metric was authorized by this repair.

Changing the metric must update URL state, selected control, chart values and scale, Summary, Selected day, comparison, Ranking, supported archives, Report, Share, and Export context. Styling-only or label-only switching is not accepted.

## 5. Accepted interaction and layout contract

The History experience must retain:

- one coherent task-first flow;
- readable chart scale, unit, date context, and day detail;
- stable controls and accessible names;
- first keyboard entry to a visible actionable target;
- visible focus, keyboard, pointer, and touch equivalence;
- no page-level horizontal overflow at 1440, 820, 390, and 360 pixels;
- minimum target sizes and compact mobile task flow;
- no unnecessary refetch when switching loaded tasks or archives;
- stable direct links and Back/Forward restoration.

## 6. Output and publishing contract

Report, social text, share image, CSV, and JSON preserve provider, period, metric, source, state, limitation language, and existing output schemas. Observed ViewLoom data is never described as a provider-wide total.

## 7. Acceptance

The repair is accepted only when:

- local deterministic P9H1–P9H6 evidence passes on one exact candidate head;
- exact production identity and public acceptance pass;
- real Twitch and Kick Viewer-minutes and Peak viewers remain separated;
- hosted scenarios at 1440, 820, 390, 360, and forced colors pass;
- URL, Back/Forward, request-count, keyboard, touch, focus, overflow, reduced-motion, and output contracts pass;
- permanent evidence is published;
- the temporary working note is deleted.

These conditions passed for production commit `233a35ebe219c6be42723eb749e2bcc84ae7fc09`. Phase 9 is complete.