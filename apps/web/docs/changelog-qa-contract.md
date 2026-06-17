# ViewLoom Changelog QA Contract

Status: reviewed public content

The Changelog records shipped ViewLoom milestones separately from Twitch and Kick observation data.

## Canonical files

```text
data/changelog.json
public/data/changelog.json
```

`scripts/build-changelog.mjs` copies the canonical source to the public path. The two payloads must remain identical.

## Reviewed entries

```text
2026-06-18  Shareable analysis views
2026-06     ViewLoom design refresh
2026-05     Livefield becomes ViewLoom
2026-04     Livefield begins
```

Each entry contains:

```text
id
date
datePrecision
title
summary
```

Summaries describe user-visible shipped changes. PR numbers, commit SHAs, branches, work notes, and unshipped plans are not public Changelog data.

## Schema

The payload version is `viewloom-changelog-v2`.

```json
{
  "version": "viewloom-changelog-v2",
  "entries": [
    {
      "id": "stable-lowercase-slug",
      "date": "YYYY-MM-DD",
      "datePrecision": "day",
      "title": "Public milestone title",
      "summary": "Short reviewed description of a shipped public change."
    }
  ]
}
```

`datePrecision` may be `month` or `day`.

## Public page

The public page is `/changelog/`. It reads `/data/changelog.json` and renders reviewed dates, titles, and summaries. Milestone content is not hard-coded into the page.

The page includes:

- metadata and canonical URL
- a direct link to public JSON
- Loading, empty, and error states
- a retry action
- responsive timeline presentation

Unavailable data must not be replaced with invented entries.

## QA rules

- JSON must parse successfully.
- The version must be `viewloom-changelog-v2`.
- IDs must be unique lowercase slugs.
- Titles and summaries must not be empty.
- Dates must match their precision.
- Entries must be sorted newest first.
- Canonical and public files must match.
- All four reviewed entries must be present.
- Draft, planned, TODO, lorem, fake, and placeholder language is forbidden.
- PR numbers, commit SHAs, and branch names are forbidden.
- The page uses safe DOM text assignment.
- The page must not read GitHub or provider APIs.

## Review separation

The detailed review canvas is not public data. Future candidates are added only after they are shipped and reviewed.

## Stages

```text
Foundation        complete
Page UI           complete
Content review    complete
Home connection   pending
```
