# ViewLoom Channel output R3 preservation contract

Status: active Phase 4 R3 contract

## Purpose

Adopt only neutral shared output helpers that can be proven byte-compatible with the accepted Channel / Streamer v1 implementation.

R3 is an internal refactor. It does not reopen Channel C0–C5B acceptance and does not add a new report or export feature.

## Adopted helpers

R3 adopts:

- `finiteNumberOrBlank` for Channel CSV numeric cells;
- `finiteNumberOrNull` for Channel JSON numeric fields;
- shared `csvCell` with `quote: 'minimal'` and `spreadsheetSafety: 'none'`;
- shared filename composition using the existing feature-owned segment order.

R3 does not adopt:

- shared provider display helpers, because Channel provider labels are embedded in feature-owned report prose;
- shared clipboard transport, because current Channel failure paths throw and preserve caller-visible error messages while the shared helper returns a neutral result;
- shared download transport, because current Channel failure paths throw and preserve caller-visible feedback while the shared helper returns a neutral result;
- any report prose, short-post prose, JSON schema, payload capture, request, DOM, CSS, action-order, or visible feedback helper.

## Exact output requirements

The following must remain exact:

```text
schema: viewloom-channel-v1
Full summary text
Short post text
CSV header order
CSV requested-day row order
CSV CRLF line endings
CSV UTF-8 BOM at download time
blank missing CSV numeric cells
minimal syntax quoting
no implicit spreadsheet formula protection
JSON key order and structure
JSON null missing numeric values
JSON indentation and trailing newline at download time
Twitch and Kick filenames
```

Filename segment order remains:

```text
viewloom / provider / channel / channel_id-or-unselected / period / extension
```

Accepted examples:

```text
viewloom-twitch-channel-alpha-7d.csv
viewloom-kick-channel-ghost-30d.json
```

## Request and provider preservation

R3 must preserve:

- exactly one provider History request per loaded period;
- no request when channel id is missing;
- task switches, copy, CSV, and JSON reuse the captured response;
- no Twitch request from a Kick Channel page;
- no Kick request from a Twitch Channel page;
- no cross-provider report, export, link, or filename.

## UI and browser preservation

R3 must not change:

- Channel HTML templates or selectors;
- Channel CSS;
- task order;
- report mode order;
- button labels;
- visible ready/success/error feedback;
- clipboard API and textarea fallback behavior;
- hidden temporary download anchor behavior;
- zero-millisecond object-URL revoke timing;
- mobile touch and overflow behavior.

## Verification

The R3 verifier must:

- transpile and execute the real `channel-report.ts` output functions;
- compare complete Full summary text;
- compare complete Short post text;
- compare complete CSV bytes before BOM insertion;
- compare the complete structured JSON object;
- compare exact Twitch and Kick filenames;
- confirm spreadsheet formula protection remains disabled;
- confirm clipboard/download behavior remains feature-owned;
- run existing Channel Report Browser and Channel Candidate Acceptance gates.
