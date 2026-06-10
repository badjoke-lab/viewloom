# ViewLoom redesign browser and build gate

Status: required for every runtime redesign PR

## 1. Required commands

Run from the repository root:

```text
pnpm check:redesign
pnpm typecheck:web
pnpm build:web
```

`check:redesign` verifies that the adopted dark redesign baseline, shared assets, public page inputs, and rejected light/serif tokens have not drifted.

## 2. Required public pages

```text
/
/about/
/support/
/twitch/
/twitch/heatmap/
/twitch/day-flow/
/twitch/battle-lines/
/twitch/history/
/twitch/status/
/kick/
/kick/heatmap/
/kick/day-flow/
/kick/battle-lines/
/kick/history/
/kick/status/
```

## 3. Required viewport matrix

Every page changed by a runtime PR must be checked at:

```text
390 × 844
768 × 1024
1200 × 800
1440 × 900
```

When the changed page contains a large chart, also verify one short-height desktop viewport:

```text
1440 × 700
```

## 4. Shared shell checks

For every changed page:

- ViewLoom brand returns to `/`.
- Portal, Twitch data, and Kick data are present.
- The correct provider section has the current-page state.
- About and Support remain internal links.
- Contact opens the existing Google form in a new tab.
- GitHub opens the repository in a new tab.
- Mobile Menu opens without horizontal page overflow.
- Header does not cover the first interactive control after anchor or keyboard navigation.
- Footer is present once and is not duplicated.

## 5. Data-state matrix

Where the page displays data status, verify the following fixture or API states:

```text
loading
fresh
partial
stale
strong_stale
empty
demo
error
unconfigured
```

Required distinctions:

- `empty` means the real data path returned no qualifying records.
- `demo` means non-current demonstration or fixture data is shown.
- `error` means a request or collection path failed.
- `partial` means real data exists but coverage is limited.
- Kick fixture source mode must display as `demo`.

## 6. Provider parity

For every shared page type changed for Twitch, inspect the matching Kick page in the same PR unless a provider-specific exception is documented.

Shared page types:

```text
Home
Heatmap
Day Flow
Battle Lines
History
Status
```

Provider parity does not mean identical data. It means consistent shell, control placement, state language, responsive behavior, and honest provider-specific limitations.

## 7. Accessibility checks

- Keyboard focus is visible.
- Tab order follows the visual order.
- Buttons have accessible names.
- Current navigation uses `aria-current="page"`.
- Data-state elements expose an accessible state label.
- Text is not communicated by color alone.
- Charts retain existing accessible labels or descriptions.
- Reduced-motion users do not lose access to controls.

## 8. Chart non-regression checks

### Heatmap

- Current Canvas renderer is still used.
- Tile selection still updates the inspector.
- Pan, zoom, reset, Wide, and Split retain their accepted behavior.
- No pan or zoom reveals empty space between the world and frame.

### Day Flow

- Existing API payload remains connected.
- Volume / Share and Full / Top Focus retain their meaning.
- Selected time and Time Focus stay synchronized.
- Others is not silently removed from Full mode.

### Battle Lines

- Existing SVG renderer is still used.
- Primary pair, context lines, selected time, inspector, and observed-state gaps remain available.
- Missing, offline, and not observed values are not joined as measured data.

### History

- Existing History API remains connected.
- Period, metric, selected day, coverage, and provider separation remain available.

## 9. Public-copy check

Changed public pages must not introduce:

```text
placeholder
shell ready
will become
future build focus
fixture
internal surface
internal stage
debug
```

Exceptions are allowed only when the word is part of an explicitly labeled Data Status diagnostic and cannot be mistaken for production data.

## 10. Merge record

Each redesign PR description must record:

- commands run;
- viewports checked;
- Twitch and Kick pages checked;
- data states checked;
- known limitations;
- whether the page interior is old or new after merge.
