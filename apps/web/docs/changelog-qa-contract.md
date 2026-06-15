# ViewLoom Changelog QA Contract

Status: foundation

The Changelog records shipped ViewLoom milestones separately from Twitch and Kick observation data.

## Canonical and published files

```text
data/changelog.json
  canonical editable source

public/data/changelog.json
  public machine-readable copy
```

`scripts/build-changelog.mjs` copies the canonical source into the public path. The two JSON payloads must remain structurally identical.

## Initial public content

The first public version intentionally contains only three broad milestones:

```text
2026-06  ViewLoom design refresh
2026-05  Livefield becomes ViewLoom
2026-04  Livefield begins
```

Dates are approximate month-level dates until reviewed and corrected. Each entry contains only:

```text
id
date
datePrecision
title
```

Detailed implementation history, PR numbers, commit SHAs, repair notes, QA changes, and unreviewed feature records are not part of the initial public data.

## Schema

The payload version is `viewloom-changelog-v1`.

```json
{
  "version": "viewloom-changelog-v1",
  "entries": [
    {
      "id": "stable-lowercase-slug",
      "date": "YYYY-MM",
      "datePrecision": "month",
      "title": "Public milestone title"
    }
  ]
}
```

`datePrecision` may later be `day` when a reviewed `YYYY-MM-DD` date is available.

## QA rules

- JSON must parse successfully.
- The version must be `viewloom-changelog-v1`.
- IDs must be unique lowercase slugs.
- Titles must not be empty.
- Dates must match their declared precision.
- Entries must be sorted newest first.
- The canonical and public files must match.
- The initial public file must contain exactly the three approved milestone entries.
- Draft, planned, TODO, lorem, fake, or placeholder entries are forbidden.
- Unreviewed detailed descriptions are forbidden during this foundation stage.

## Review canvas separation

The detailed review canvas is not public data.

It will be written separately in the conversation with proposed dates, headings, detailed changes, merge candidates, removal candidates, and correction notes. Nothing from that review canvas is added to the public JSON until the user approves it.

## Implementation stages

```text
1. Foundation
   canonical JSON, public JSON, build script, QA, CI

2. Page UI
   /changelog/ reads the approved public JSON

3. Content review and connection
   approved review-canvas entries only; Provider Home updates later read the same source
```
