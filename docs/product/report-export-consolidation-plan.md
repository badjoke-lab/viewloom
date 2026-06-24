# ViewLoom Report & Export shared-layer consolidation plan

Status: active implementation plan — R3 active
Version: 1.3
Last updated: 2026-06-24
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation
Current audit: `../work-in-progress/report-export-r0-audit.md`
R1 contract: `../../apps/web/docs/shared-output-r1-contract.md`
R2 contract: `../../apps/web/docs/history-output-r2-contract.md`
R3 contract: `../../apps/web/docs/channel-output-r3-contract.md`
History specification: `history-and-trends-spec.md`
Channel specification: `channel-and-streamer-spec.md`

## 1. Goal

Reduce duplicated report/export infrastructure across History and Channel without changing accepted feature semantics, visible layouts, serialized schemas, provider separation, request counts, or failure feedback.

This phase is an internal consolidation, not a new reporting feature.

## 2. Governing constraints

Every PR must preserve:

- separate Twitch and Kick data, routes, labels, filenames, and claims;
- History schema `viewloom-history-export-v1`;
- Channel schema `viewloom-channel-v1`;
- existing CSV headers and row meaning;
- History spreadsheet-safety behavior;
- Channel minimal quoting with no implicit spreadsheet formula protection;
- Channel blank missing CSV numeric cells;
- JSON `null` missing values;
- existing report and short-post text;
- History share-card and PNG behavior;
- one existing provider History response per loaded period;
- no new API, D1, binding, collector, cron, or retention work;
- no History or Channel DOM/CSS/layout change.

History UI appearance work remains a separate pending phase. Shared-layer work must not pre-empt or reshape it.

## 3. Approved shared boundary

The shared layer may own only:

```text
provider type and display name
filename-segment sanitization
filename composition
CSV syntax escaping
finite number -> blank
finite number -> null
clipboard transport with fallback
text-file Blob download transport
operation success/failure result type
```

The shared layer must not own:

```text
History or Channel models
API endpoints or payload capture
report/short-post templates
CSV headers or row builders
JSON schemas or object builders
coverage/limitation wording
History share-card canvas logic
DOM selectors or HTML templates
CSS or responsive layout
feature-visible status messages
```

## 4. Shared module layer

Implemented in R1:

```text
apps/web/src/shared/output/
  provider.ts
  filename.ts
  csv.ts
  values.ts
  clipboard.ts
  download.ts
  result.ts
```

Dependency rule:

```text
shared/output may depend only on primitive TypeScript/browser APIs
shared/output must not import History or Channel modules
feature adoption occurs only in dedicated preservation PRs
```

Contracts and workflow:

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/scripts/verify-shared-output-r1.mjs
apps/web/docs/history-output-r2-contract.md
apps/web/scripts/verify-history-output-r2.mjs
apps/web/docs/channel-output-r3-contract.md
apps/web/scripts/verify-channel-output-r3.mjs
.github/workflows/shared-output-r1.yml
```

The workflow name is `Shared Output Contracts` and executes the neutral R1 contract plus exact History R2 and Channel R3 preservation contracts.

## 5. Stable helper behavior

### Provider

```ts
type OutputProvider = 'twitch' | 'kick'
isOutputProvider(value)
providerDisplayName(provider)
```

Provider values are not coerced. Labels are exactly `Twitch` and `Kick`.

### Filename

```ts
sanitizeFilenameSegment(value, fallback?)
buildOutputFilename(parts, extension)
```

- Unicode NFKC normalization;
- Unicode letters and numbers retained;
- unsafe path/control characters removed;
- feature code owns segment selection and order.

### CSV

```ts
csvCell(value, options?)
csvRow(values, options?)
spreadsheetSafeText(value)
```

Options:

```text
quote: minimal | always
spreadsheetSafety: none | apostrophe
```

Accepted feature policies remain separate:

- Channel: `quote: minimal`, `spreadsheetSafety: none`;
- History: `quote: always`, `spreadsheetSafety: apostrophe`.

### Numeric values

```ts
finiteNumberOrBlank(value)
finiteNumberOrNull(value)
```

Only finite JavaScript numbers are accepted. Numeric strings are not coerced.

### Clipboard

```ts
writeTextToClipboard(text, runtime?)
```

The helper owns transport and neutral results only. Feature-visible fallback and messages remain feature-owned.

### Download

```ts
downloadTextFile(request, runtime?)
```

The helper owns Blob/object URL/temporary-anchor transport and neutral results only. Feature-specific exception behavior, anchor behavior, revoke timing, and messages may remain feature-owned.

## 6. PR sequence

### R0 — current implementation and boundary audit

State: completed through PR #409.

```text
branch: work-report-export-r0-audit
merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487
```

Completed:

- inventoried History and Channel output code and gates;
- compared filenames, CSV, JSON, clipboard, download, PNG, feedback, DOM, and request behavior;
- fixed the neutral shared boundary;
- documented spreadsheet-safety, filename, and UI risks;
- fixed the R1–R4 sequence.

### R1 — neutral shared output primitives

State: completed through PR #410.

```text
branch: work-report-export-r1-shared-output
merge: 6b90c277460a674e355a7676444ddf10ff296325
```

Completed:

- neutral provider, filename, CSV, finite-value, clipboard, download, and result modules;
- direct executable contracts;
- Unicode and unsafe filename coverage;
- minimal/always CSV quoting and explicit spreadsheet safety;
- finite/missing/invalid numeric coverage;
- clipboard and object URL lifecycle coverage;
- no History or Channel import or migration.

### R2 — conditional History internal adoption

State: completed through PR #411.

```text
branch: work-report-export-r2-history-adoption
merge: 9bd7df7620c87c48e5c2d2834cfdce712ad71e3e
```

Adopted:

```text
finiteNumberOrNull
CSV cell syntax:
  quote: always
  spreadsheetSafety: apostrophe
History filename composition
```

Exact preservation gate covers:

- complete `viewloom-history-export-v1` model;
- complete CSV bytes, CRLF endings, blank null cells, quoting, and formula safety;
- complete JSON indentation and trailing newline;
- complete Twitch and Kick report text;
- exact Twitch and Kick filenames;
- current feature-owned clipboard fallback;
- current temporary download anchor and 1000 ms revoke timing.

Deferred in R2:

```text
provider display helper
clipboard transport
text download transport
```

### R3 — conditional Channel internal adoption

State: active in PR #412.

```text
branch: work-report-export-r3-channel-adoption
```

Adopted implementation:

```text
apps/web/src/live/channel-report.ts
  csvNumber -> finiteNumberOrBlank
  nullableNumber -> finiteNumberOrNull
  local csvCell -> shared csvCell
  quote: minimal
  spreadsheetSafety: none
  literal filename interpolation -> buildOutputFilename
  feature-owned segment order remains unchanged
```

Exact preservation gate covers:

- complete Full summary text;
- complete Short post text;
- complete CSV bytes before BOM insertion;
- CRLF endings and blank missing numeric cells;
- minimal syntax quoting;
- explicit absence of spreadsheet formula protection;
- complete `viewloom-channel-v1` JSON object;
- JSON `null` missing numeric values;
- exact Twitch and Kick filenames;
- current feature-owned clipboard fallback;
- current hidden temporary download anchor and zero-millisecond revoke timing.

Deferred in R3:

```text
provider display helper
clipboard transport
text download transport
```

Reasons:

- provider display remains embedded in feature-owned report prose;
- current Channel clipboard and download helpers throw on transport failure and preserve caller-visible error messages;
- shared helpers return neutral result objects, so replacing those paths would change failure semantics or require additional adaptation beyond the pure-helper scope.

R3 stop rule:

- do not add spreadsheet formula protection to Channel CSV;
- do not change Channel UI or output to fit a shared helper;
- defer any helper whose adoption requires DOM, CSS, task-order, label, feedback, report, schema, filename, request, or provider change.

R3 completion:

- exact Channel preservation workflow succeeds;
- Channel Report Browser succeeds for Twitch desktop and Kick mobile;
- Channel Candidate Acceptance succeeds;
- one provider History request remains;
- no DOM/CSS/layout or visible feedback difference;
- complete affected History, Channel, Web, naming, policy, and Status matrix succeeds;
- final diff is limited to approved output internals, contracts, workflow, gates, and source-of-truth documents.

### R4 — cross-page regression and documentation closure

State: queued after the PR #412 merge report.

```text
branch: work-report-export-r4-acceptance
```

Scope:

- run complete affected History and Channel gates;
- verify exact filenames, schemas, headers, missing-value policy, provider separation, report text, failure semantics, and request counts;
- verify no visible layout change;
- mark this plan completed;
- update roadmap and schedule to Phase 5;
- delete the temporary R0 audit note and unlink it.

Preview rule:

- no Cloudflare Preview is required for output-compatible internal consolidation;
- Preview and production acceptance become required if an accepted visible or serialized contract changes.

## 7. Preservation matrix

| Contract | History | Channel |
|---|---:|---:|
| provider separation | required | required |
| no extra History request | required | required |
| exact report text | required | required |
| exact short-post text | required | required |
| exact CSV header | required | required |
| exact CSV row meaning | required | required |
| exact filename | required | required |
| blank missing CSV numerics | contract-specific | required |
| spreadsheet formula safety | apostrophe required | none; no silent change |
| JSON schema | `viewloom-history-export-v1` | `viewloom-channel-v1` |
| JSON missing numerics | current contract | `null` |
| PNG/share card | required | not applicable |
| DOM/CSS/layout unchanged | required | required |
| failure feedback unchanged | required | required |

## 8. Explicit non-goals

Phase 4 does not include:

- new report modes or export formats;
- Channel PNG/share cards;
- cross-platform combined output;
- provider-wide claims;
- shared report prose or JSON schemas;
- History or Channel visual redesign;
- API or storage changes;
- collector, cron, or retention changes.

## 9. Current next step

Complete and merge PR #412 only after:

- the latest head passes `Shared Output Contracts`;
- Channel Report Browser and Channel Candidate Acceptance pass;
- the broader History, Channel, Web, naming, policy, and Status regression matrix passes;
- the final diff contains no UI, API, database, collector, cron, or retention change.

After the required PR #412 merge report, begin R4 only from the new `main`.
