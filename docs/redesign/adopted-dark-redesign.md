# ViewLoom dark redesign adoption baseline

Status: adopted implementation source of truth

## 1. Decision

ViewLoom adopts the user-approved dark redesign mock as the visual and structural baseline for the ongoing production migration.

This document fixes the baseline so later work does not drift back toward the previous card-heavy SaaS layout or toward the rejected light editorial mock.

## 2. Adopted visual identity

### Core colors

```text
Background          #07111f
Deep background     #050b14
Primary surface     #0b1626
Raised surface      #0e1b2d
Primary text        #eef4ff
Muted text          #9fb0ca
Portal accent       #2c97ff
Twitch accent       #905aff
Kick accent         #22d378
Battle primary A    #7dd3fc
Battle primary B    #f472b6
Battle context      #8ea0bd
```

### Typography

- Primary UI font: Inter, followed by the existing system sans-serif stack.
- Monospace is limited to timestamps, technical state values, aligned numeric data, and identifiers.
- Serif fonts are not part of the adopted redesign.

### Visual constraints

- Keep the dark ViewLoom identity.
- Use provider accents as navigation and selection signals, not as full-page paint.
- Keep chart meaning separate from provider branding.
- Do not restore the rejected beige or white editorial palette.
- Do not restore large ambient glows, repeated glass cards, or decorative gradients across every section.
- Use pills only for actionable filters or compact state labels.
- Keep charts, tables, and observed values ahead of explanatory copy.

## 3. Adopted page structure

The migration covers the current public page set:

```text
Portal
About
Support
Twitch Home
Twitch Heatmap
Twitch Day Flow
Twitch Battle Lines
Twitch History
Twitch Status
Kick Home
Kick Heatmap
Kick Day Flow
Kick Battle Lines
Kick History
Kick Status
```

The approved mock changes information architecture per page instead of forcing every page into one shared card template.

### Portal

- Compact ViewLoom introduction.
- Separate Twitch and Kick observation entrances.
- Current provider state and recent observation signals before marketing copy.

### Provider Home

- Current observed data first.
- Direct entry to Heatmap, Day Flow, Battle Lines, and History.
- No future-build or shell-ready copy.

### Heatmap

- Toolbar and data state strip.
- Large heatmap field as the primary surface.
- Selected stream inspector adjacent to the field.
- Existing production Canvas renderer remains authoritative.

### Day Flow

- Controls, data state, daily terrain, time focus, and selected stream detail.
- Existing production renderer and API remain authoritative.

### Battle Lines

- Primary battle summary, large chart, time inspector, secondary battles, and event feed.
- Existing production SVG renderer remains authoritative.

### History

- Period controls, summary, main trend, selected day, rankings, daily archive, and coverage.
- Existing production History API remains authoritative.

### Status

- Operational ledger rather than a marketing card grid.
- Collector, snapshot, cadence, coverage, source, feature matrix, pipeline, and limitations.

## 4. Production migration rules

1. The mock provides structure and visual rules, not production data.
2. Static mock values must never be copied into production output.
3. Existing APIs, D1 databases, collectors, and retention rules remain in place unless changed by a separate data PR.
4. Existing Canvas and SVG renderers must be mounted into the new page structures rather than replaced by static mock graphics.
5. Pages migrate one at a time. During migration, the shared shell may be new while individual page interiors remain old.
6. A page is either on the old interior or the new interior. Avoid publicly shipping half-converted page sections.
7. Twitch and Kick parity is required for shared page types unless a provider-specific limitation is explicitly documented.
8. Real, partial, stale, empty, demo, error, and unconfigured states must remain distinguishable.
9. Public copy must not contain implementation-stage language such as `placeholder`, `shell ready`, `will become`, internal `surface` or `stage` terminology, debug labels, or fixture terminology.
10. Existing analytics, canonical URLs, search verification, support links, and public legal/contact routes must not regress.

## 5. Migration order

```text
Release A  Shared foundation and outer pages
Release B  History
Release C  Heatmap
Release D  Day Flow
Release E  Battle Lines
Release F  Cross-page and return-use features
Release G  Channel, search, and exports
```

The detailed PR schedule is maintained in the project implementation thread. This file fixes the design baseline and non-regression rules only.

## 6. Browser and build gates

Every runtime migration PR must pass:

```text
pnpm typecheck:web
pnpm build:web
```

Required viewport checks:

```text
390px
768px
1200px
1440px
```

Required data-state checks where applicable:

```text
real
partial
stale
empty
demo
error
```

## 7. Rejected directions

The following are not implementation references:

- The earlier light or beige editorial mock.
- Serif-led typography.
- A wholesale Next.js, Supabase, WebSocket, or TimescaleDB migration.
- Replacing the production renderers with static HTML charts.
- Returning to a repeated hero plus three-card SaaS template.

## 8. Definition of done for the redesign program

The redesign program is complete when:

- all listed public pages use the adopted dark structure;
- production APIs and renderers are connected;
- public unfinished language has been removed;
- shared data-state presentation is consistent;
- old bridge, experiment, debug, and visual override code has been either formalized or removed;
- Twitch and Kick pass the shared browser gate;
- no accepted production capability is lost during the migration.
