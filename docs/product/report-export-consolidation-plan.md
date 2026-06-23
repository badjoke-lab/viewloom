# ViewLoom Report & Export shared-layer consolidation plan

Status: active implementation plan — R2 active
Version: 1.2
Last updated: 2026-06-24
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation
Current audit: `../work-in-progress/report-export-r0-audit.md`
R1 contract: `../../apps/web/docs/shared-output-r1-contract.md`
R2 contract: `../../apps/web/docs/history-output-r2-contract.md`
History specification: `history-and-trends-spec.md`
Channel specification: `channel-and-streamer-spec.md`

## 1. Goal

Reduce duplicated report/export infrastructure across History and Channel without changing accepted feature semantics, visible layouts, serialized schemas, provider separation, or network behavior.

This phase is an internal consolidation, not a new reporting feature.

## 2. Governing constraints

Every PR must preserve:

- separate Twitch and Kick data, routes, labels, filenames, and claims;
- History schema `viewloom-history-export-v1`;
- Channel schema `viewloom-channel-v1`;
- existing CSV headers and row meaning;
- History spreadsheet-safety behavior;
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
.github/workflows/shared-output-r1.yml
```

The workflow name is now `Shared Output Contracts` and executes both the neutral R1 contract and the exact History R2 preservation contract.

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

This represents both accepted contracts without forcing them together:

- Channel: minimal syntax quoting and no implicit formula-policy change;
- History: always-quoted non-null cells and apostrophe formula safety.

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

The helper owns Blob/object URL/temporary-anchor transport and neutral results only. Feature-specific anchor behavior, revoke timing, and messages may remain feature-owned.

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

State: active in PR #411.

```text
branch: work-report-export-r2-history-adoption
```

Entry conditions are satisfied for three helpers only:

```text
finiteNumberOrNull
CSV cell syntax
filename composition
```

Adopted implementation:

```text
apps/web/src/live/history-export-model.ts
  finiteOrNull -> finiteNumberOrNull

apps/web/src/live/history-export-serialize.ts
  local CSV helper -> shared csvCell
  quote: always
  spreadsheetSafety: apostrophe

apps/web/src/live/history-export.ts
  literal filename interpolation -> buildOutputFilename
  feature-owned segment order remains unchanged
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

Reasons:

- provider display is embedded in feature-owned report prose;
- shared clipboard fallback uses an internal textarea while accepted History selects the visible report preview;
- shared download transport sets a hidden temporary anchor and defaults to caller-selected timing, while accepted History retains its current anchor behavior and 1000 ms revoke delay.

R2 stop rule:

- do not adopt a deferred helper merely to increase reuse;
- do not change History UI or output to fit the shared helper;
- defer any helper whose adoption requires a DOM, CSS, label, status, report, schema, filename, PNG, or request change.

R2 completion:

- exact History preservation workflow succeeds;
- History Export and H4 terminal/browser gates succeed;
- no extra History request;
- no DOM/CSS/layout difference;
- Twitch and Kick browser gates pass;
- final diff is limited to approved output internals, contracts, workflow, and source-of-truth documents.

### R3 — Channel internal adoption

State: queued after the R2 merge report.

```text
branch: work-report-export-r3-channel-adoption
```

Entry conditions:

- R1 helpers are stable;
- exact Channel preservation tests cover filenames, headers, blank/null values, report text, JSON, and request counts;
- Channel spreadsheet-safety policy remains explicit.

Planned safe candidates:

```text
finiteNumberOrBlank
finiteNumberOrNull
minimal CSV syntax quoting
filename composition
clipboard API path only when visible fallback is preserved
text download only when temporary-anchor and revoke behavior are preserved
```

Channel formula protection must not be added silently because it changes accepted CSV bytes.

Completion:

- exact Channel output compatibility passes;
- one provider History request remains;
- no DOM/CSS/layout or visible status difference;
- Twitch and Kick browser gates pass.

### R4 — cross-page regression and documentation closure

State: queued.

```text
branch: work-report-export-r4-acceptance
```

Scope:

- run complete affected History and Channel gates;
- verify exact filenames, schemas, headers, missing-value policy, provider separation, and request counts;
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
| spreadsheet formula safety | required | no silent change |
| JSON schema | `viewloom-history-export-v1` | `viewloom-channel-v1` |
| JSON missing numerics | current contract | `null` |
| PNG/share card | required | not applicable |
| DOM/CSS/layout unchanged | required | required |

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

Complete and merge PR #411 only after:

- the latest head passes `Shared Output Contracts`;
- History Export and H4 terminal/browser workflows pass;
- the broader History/Channel regression matrix passes;
- the final diff contains no UI, API, database, collector, cron, retention, or PNG change.

After the required PR #411 merge report, begin R3 only from the new `main`.
