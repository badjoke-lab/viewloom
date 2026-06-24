# TEMPORARY — ViewLoom Local Watchlist v1 W0

Status: active W0 specification work
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Branch: `work-watchlist-w0`
Delete when: W5 production acceptance and documentation closure are complete.

## Purpose

Freeze the permanent Local Watchlist v1 product contract and W1–W5 implementation plan before any runtime work begins.

## W0 boundaries

This branch is documentation-only. It must not add or change:

- public routes or HTML;
- Watchlist runtime or localStorage code;
- existing History, Channel, Heatmap, Day Flow, Battle Lines, Home, or Status UI;
- API behavior or response schemas;
- D1 schemas, bindings, collectors, cron, or retention;
- Twitch/Kick provider separation.

## Governing decisions already fixed

- provider-specific routes are expected at `/twitch/watchlist/` and `/kick/watchlist/`;
- browser localStorage only;
- one provider Heatmap request and one provider History request per loaded period;
- all saved ids are matched locally;
- no per-channel request loop;
- absence from the latest observed set is not confirmed offline;
- absence from retained History is not complete history;
- no alerts, login, cloud sync, exact sessions, cross-provider identity, or new server storage;
- initial recommendation is at most 50 saved ids per provider.

## W0 decisions to freeze

- route and navigation position;
- localStorage key, schema version, validation, migration, and recovery;
- id normalization and duplicate handling;
- saved-entry limit, ordering, and default visible count;
- add/remove/reorder entry points;
- URL state and period behavior;
- latest and retained evidence-state model;
- exact labels, absence language, and limitations;
- request lifecycle, cache reuse, and failure isolation;
- desktop/tablet/mobile information architecture;
- accessibility, SEO, privacy, and storage disclosure;
- W1–W5 PR boundaries and acceptance gates.

## Stop rule

No Watchlist runtime implementation begins until W0 merges and the full merge report is issued.
