# Heatmap Selected Stream Inspector

This document records PR 9 of the 12-PR Heatmap repair schedule.

## Purpose

Turn the selected-stream region into an actual analysis surface instead of a four-value placeholder.

## Snapshot fields

The inspector shows the selected stream's display name, channel login, live state, stream title when available, current viewers, observed rank, observed share, momentum value, momentum direction, momentum window, and activity state.

Observed rank and observed share refer only to the records present in the current valid Heatmap snapshot. They are not platform-wide rank or platform-wide share.

Activity has three explicit presentations:

- available and sampled: show the observed value
- available but not sampled: show `Not sampled`
- unavailable: show `Unavailable` and the reason when supplied

## Recent observation context

The inspector reads a separate context endpoint backed by stored hot snapshots. It inspects up to 288 five-minute snapshots, or approximately 24 hours, and derives the current contiguous observation run for the selected stream.

It shows:

- observed since
- observed duration
- latest observed peak
- peak time
- sample count and whether the query reached its 24-hour boundary

These values are observation facts, not claims about the stream's complete platform session. A gap ends the current contiguous observed run.

## Actions

The inspector provides labeled destinations:

- open on Twitch or Kick
- open the selected stream in Battle Lines
- review the selected stream in seven-day History

The destination pages receive the selected stream as a URL parameter. Existing page behavior remains authoritative if that page cannot use the parameter yet.

## Wide and Split

The same inspector data is used in both layouts.

- Wide presents the inspector as a compact full-width region below the map
- Split presents the same content in the right rail
- selection survives layout switching through the existing Heatmap selection state
- long names and titles wrap instead of widening the page

## Compatibility boundary

The legacy renderer still writes its old selected-detail element IDs. PR 9 keeps those IDs in a hidden compatibility bridge and renders the completed inspector into separate IDs, preventing legacy writes from replacing truthful activity, rank, share, and observation context.

## Scope boundary

PR 9 does not finish page summary metrics, legend, coverage notes, automatic-refresh visibility, mobile bottom-sheet behavior, or final keyboard and focus work. Those remain PR 10 and PR 11.
