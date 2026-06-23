# ViewLoom Report & Export shared-layer consolidation plan

Status: active implementation plan — R1 active
Version: 1.1
Last updated: 2026-06-24
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation
Current audit: `../work-in-progress/report-export-r0-audit.md`
R1 contract: `../../apps/web/docs/shared-output-r1-contract.md`
History specification: `history-and-trends-spec.md`
Channel specification: `channel-and-streamer-spec.md`

## 1. Goal

Reduce duplicated report/export infrastructure across History and Channel without changing accepted feature semantics, visible layouts, serialized schemas, provider separation, or network behavior.

The phase is an internal consolidation, not a new reporting feature.

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
- History share-card behavior and PNG output;
- one existing provider History response per loaded period;
- no new API, D1, binding, collector, cron, or retention work;
- no History or Channel DOM/CSS/layout change.

History UI appearance work remains a separate pending phase. Shared-layer work must not pre-empt or reshape it.

## 3. Approved shared boundary

The shared layer may own neutral primitives only:

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

## 4. Shared module shape

R1 implements:

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
History and Channel do not import shared/output until separate adoption PRs
```

R1 contract and executable gate:

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/scripts/verify-shared-output-r1.mjs
.github/workflows/shared-output-r1.yml
```

## 5. R1 stable signatures and behavior

### Provider

```ts
type OutputProvider = 'twitch' | 'kick'
isOutputProvider(value)
providerDisplayName(provider)
```

Provider values are not coerced. Labels remain exactly `Twitch` and `Kick`.

### Filename

```ts
sanitizeFilenameSegment(value, fallback?)
buildOutputFilename(parts, extension)
```

- Unicode is normalized with NFKC;
- Unicode letters and numbers remain usable;
- unsafe path/control characters are removed through hyphen normalization;
- feature code owns segment selection and order;
- R1 does not change any accepted feature filename.

### CSV

```ts
csvCell(value, options?)
csvRow(values, options?)
spreadsheetSafeText(value)
```

Options distinguish:

```text
quote: minimal | always
spreadsheetSafety: none | apostrophe
```

This allows exact future representation of both existing contracts:

- Channel: minimal syntax quoting, no implicit formula-policy change;
- History: always-quoted data cells with apostrophe formula safety.

R1 does not migrate either serializer or change output bytes.

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

- prefers an injected/browser Clipboard API;
- supports an injected textarea/`execCommand('copy')` fallback when the API is absent;
- API rejection returns a neutral failure rather than selecting feature-visible fallback behavior;
- the helper owns no UI message.

### Download

```ts
downloadTextFile(request, runtime?)
```

- uses Blob/object URL/temporary anchor transport;
- requires non-empty filename and MIME type;
- removes the temporary anchor;
- revokes object URLs on the requested delay or immediately after failure;
- the helper owns no UI message.

### Result

```ts
type OutputOperationResult =
  | { ok: true }
  | { ok: false; code: OutputOperationFailureCode; error?: unknown }
```

Visible wording remains feature-owned.

## 6. PR sequence

### R0 — current implementation and boundary audit

State: completed through PR #409.

```text
branch: work-report-export-r0-audit
merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487
```

Completed:

- inventoried History and Channel output code and gates;
- compared provider, period, source/state, coverage, filename, CSV, JSON, clipboard, download, PNG, feedback, DOM, and request behavior;
- fixed the neutral shared boundary;
- documented spreadsheet-safety, filename, and UI risks;
- fixed the R1–R4 sequence.

### R1 — neutral shared output primitives

State: active in PR #410.

```text
branch: work-report-export-r1-shared-output
```

Implemented scope:

- approved neutral modules;
- direct contract verification for every helper group;
- Unicode and unsafe filename cases;
- CSV commas, quotes, CR, LF, minimal/always quote modes, and explicit spreadsheet safety;
- finite/missing/invalid numeric values;
- clipboard API, API rejection, fallback, cleanup, and unavailable paths;
- object URL creation, scheduled revocation, failure revocation, and temporary-anchor cleanup;
- dedicated typecheck and executable contract workflow;
- no History or Channel import or migration.

Completion:

- shared helpers have stable signatures;
- dedicated R1 workflow succeeds;
- repository build/check and affected regression gates succeed;
- no feature output bytes or visible behavior change;
- no feature model or UI dependency in the shared layer;
- latest PR head is mergeable with no unresolved review thread.

### R2 — conditional History internal adoption

State: conditional after R1.

```text
branch: work-report-export-r2-history-adoption
```

Entry conditions:

- exact preservation tests exist for every replaced History helper;
- adoption requires no DOM, CSS, label, action-order, report-text, schema, filename, or PNG change.

Scope:

- adopt only approved provider/filename/CSV/value/clipboard/download primitives;
- retain History model construction and serializers;
- retain History report and short-post text;
- retain `viewloom-history-export-v1`;
- retain spreadsheet-safety output;
- retain share-card code and PNG behavior;
- retain feature-owned feedback messages.

Stop rule:

- defer any helper whose adoption changes output or requires a History UI edit.

Completion:

- exact History output compatibility passes;
- no extra History request;
- no DOM/CSS/layout difference;
- Twitch and Kick browser gates pass.

### R3 — Channel internal adoption

State: queued after the shared foundation.

```text
branch: work-report-export-r3-channel-adoption
```

Entry conditions:

- R1 helpers are stable;
- Channel preservation tests cover exact filenames, headers, blank/null values, report text, and request counts;
- spreadsheet-safety policy is explicit before any Channel CSV byte change.

Scope:

- adopt only approved neutral helpers;
- retain Channel context and payload capture;
- retain report and short-post wording;
- retain CSV header/row semantics;
- retain `viewloom-channel-v1`;
- retain feature-owned feedback and DOM/CSS.

Completion:

- exact Channel output compatibility passes;
- one provider History request remains;
- no DOM/CSS/layout difference;
- Twitch and Kick browser gates pass.

### R4 — cross-page regression and documentation closure

State: queued.

```text
branch: work-report-export-r4-acceptance
```

Scope:

- run complete affected History and Channel gates;
- verify exact filenames, schemas, headers, missing-value policy, provider separation, and request counts;
- verify no page-level horizontal overflow or visible layout change;
- update this plan to completed status;
- update roadmap and schedule to Phase 5;
- delete the temporary R0 audit note and unlink it.

Preview rule:

- no Cloudflare Preview is required for output-compatible internal consolidation;
- Preview and production acceptance become required if an accepted visible or serialized contract changes.

Completion:

- latest candidate HEAD is green;
- permanent docs reflect the final shared boundary;
- temporary note is removed;
- next data-capability audit step is explicit.

## 7. Required preservation matrix

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
| spreadsheet formula safety | required | explicit decision before adoption |
| JSON schema | `viewloom-history-export-v1` | `viewloom-channel-v1` |
| JSON missing numerics | current contract | `null` |
| PNG/share card | required | not applicable |
| DOM/CSS/layout unchanged | required | required |

## 8. Explicit non-goals

Phase 4 does not include:

- a new report mode;
- a new export format;
- Channel PNG/share cards;
- cross-platform combined output;
- provider-wide claims;
- shared report prose;
- shared JSON schemas;
- History visual redesign;
- Channel visual redesign;
- API or storage changes;
- collector, cron, or retention changes.

## 9. Estimated execution

| Step | Estimated work |
|---|---:|
| R0 audit and plan | complete |
| R1 shared primitives | active |
| R2 conditional History adoption | 1 focused workday or defer |
| R3 Channel adoption | 1 focused workday |
| R4 regression and closure | 1 focused workday |

## 10. Current next step

Complete and merge PR #410 only after the latest head passes the dedicated R1 contract and the existing affected regression matrix.

After the required post-merge report, evaluate R2 entry conditions before creating `work-report-export-r2-history-adoption`.
