# ViewLoom History output R2 preservation contract

Status: active Phase 4 R2 contract

## Purpose

Adopt only neutral shared output helpers that can be proven byte-compatible with the accepted History implementation.

R2 is an internal refactor. It is not a History UI revision and does not reopen History H1–H7 acceptance.

## Adopted helpers

R2 adopts:

- `finiteNumberOrNull` in the History export model;
- shared CSV cell syntax with `quote: 'always'` and `spreadsheetSafety: 'apostrophe'`;
- shared filename composition using the existing feature-owned segment order.

R2 does not adopt:

- shared provider display helpers, because History report prose remains feature-owned;
- shared clipboard transport, because accepted History fallback selects the visible preview rather than using an internal textarea copy;
- shared download transport, because accepted History uses a visible temporary anchor and a 1000 ms object-URL revoke delay;
- any DOM, CSS, visible status, report, short-post, JSON-builder, PNG, payload-capture, or request helper.

## Exact output requirements

The following must remain exact:

```text
schema: viewloom-history-export-v1
CSV header order
CSV CRLF line endings
blank null CSV cells
always-quoted non-null CSV cells
embedded quote doubling
apostrophe spreadsheet protection after trimStart()
JSON indentation and trailing newline
provider-specific view URL
Twitch and Kick filenames
report and short-post wording
```

Filename segment order remains:

```text
viewloom / provider / history / from / to / extension
```

Accepted examples:

```text
viewloom-twitch-history-2026-06-20-2026-06-22.csv
viewloom-kick-history-2026-06-20-2026-06-22.json
```

## UI and browser preservation

R2 must not change:

- History HTML templates or selectors;
- History CSS;
- action order;
- button labels;
- visible status text;
- temporary anchor insertion behavior;
- 1000 ms object-URL revoke timing;
- report copy fallback behavior;
- share-card and PNG behavior;
- provider History request count.

## Verification

The R2 verifier must:

- transpile and execute the real History model and serializers;
- compare a golden export model deeply;
- compare the complete CSV string byte-for-byte;
- compare complete JSON serialization;
- compare complete report text;
- compare Twitch and Kick filenames;
- confirm deferred clipboard/download behavior remains in feature-owned source;
- run app typecheck and existing History browser regressions.
