# ViewLoom Rebuild Roadmap v0.1

## 0. Purpose

This document defines the rebuild order for ViewLoom as the new main repository.
The old `livefield` repository remains a reference, comparison target, and data-rescue source, but new foundation work happens here.

## 1. Rebuild principles

1. Foundation before visuals.
2. Twitch first, Kick second.
3. Shared shell and route model before per-page polish.
4. Heatmap / Day Flow / Battle Lines remain the fixed core roles.
5. DB and collector design must match the DB plan spec from the beginning.

## 2. Repository role split

### viewloom
- main rebuild line
- source of truth for new architecture
- new branding, shell, layout, and route structure
- new DB / retention / cutover model

### livefield
- reference implementation
- old behavior comparison target
- data rescue and debugging source
- temporary public prototype only

## 3. Rebuild phases

### Phase 0: docs and foundation
- add DB plan spec
- add rebuild roadmap
- add UI direction doc
- define top-level repository structure
- define environment split for Paid / Free

### Phase 1: shell and routing
- portal page
- `/twitch` top shell
- `/kick` top shell
- shared app shell primitives
- shared nav, layout, cards, status blocks

### Phase 2: Twitch first vertical slice
- Twitch Heatmap
- Twitch Day Flow
- Twitch Battle Lines
- status wiring for Twitch
- first smoke-test routes

### Phase 3: Kick mirror
- Kick shell
- Kick Heatmap
- Kick Day Flow
- Kick Battle Lines
- kick-specific collector and display adjustments

### Phase 4: data/ops hardening
- DB split implementation
- hot/history retention wiring
- archive and cutover jobs
- auto-monitoring and degraded mode
- smoke tests and route health checks

### Phase 5: polish and rollout
- visual polish
- copy cleanup
- portal refinement
- donate/status/about integration
- final public brand rollout

## 4. Immediate implementation order

1. docs
2. shell skeleton
3. Twitch Heatmap
4. Twitch Day Flow
5. Twitch Battle Lines
6. Kick shell + Kick 3 pages
7. ops hardening
8. visual polish

## 5. First milestone

The first meaningful milestone is:

- portal exists
- Twitch shell exists
- Twitch Heatmap works on new foundation
- docs are committed as source of truth

## 6. Definition of done for migration start

Migration from old Livefield should not be considered started until all of the following are true:

- source-of-truth docs are present
- shell routes are present
- Twitch Heatmap is live on the new repo
- DB split plan is reflected in code structure
- old repo is no longer the default target for new work
