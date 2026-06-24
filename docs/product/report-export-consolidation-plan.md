# ViewLoom Report & Export shared-layer consolidation plan

Status: completed implementation plan and permanent milestone record
Version: 1.4-complete
Last updated: 2026-06-24
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation completed
Closure PR: #413
Permanent acceptance: `../operations/report-export-consolidation-acceptance-2026-06-24.md`
R1 contract: `../../apps/web/docs/shared-output-r1-contract.md`
R2 contract: `../../apps/web/docs/history-output-r2-contract.md`
R3 contract: `../../apps/web/docs/channel-output-r3-contract.md`

## 1. Goal and result

Phase 4 reduced duplicated report/export infrastructure across History and Channel without changing accepted feature semantics, visible layouts, serialized schemas, provider separation, request counts, or failure feedback.

The result is a neutral shared output layer plus exact feature-preservation contracts. This was an internal consolidation, not a new reporting feature.

## 2. Accepted shared boundary

The shared layer owns only:

```text
provider primitive
filename-segment sanitization
filename composition
CSV syntax escaping
finite number -> blank
finite number -> null
clipboard transport with neutral result
text-file Blob download transport with neutral result
operation success/failure result type
```

The shared layer does not own:

```text
History or Channel models
API endpoints or payload capture
report or short-post templates
CSV headers or row builders
JSON schemas or object builders
coverage or limitation wording
History share-card canvas logic
DOM selectors or HTML templates
CSS or responsive layout
feature-visible status messages
```

Dependency direction:

```text
shared/output may depend only on primitive TypeScript and browser APIs
History may import shared/output
Channel may import shared/output
shared/output must not import History or Channel
```

## 3. Shared module layer

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

Permanent contracts and gates:

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
apps/web/docs/channel-output-r3-contract.md

apps/web/scripts/verify-shared-output-r1.mjs
apps/web/scripts/verify-history-output-r2.mjs
apps/web/scripts/verify-channel-output-r3.mjs

.github/workflows/shared-output-r1.yml
```

The workflow name is `Shared Output Contracts` and executes app typechecking plus R1, exact History R2, and exact Channel R3 verification.

## 4. Stable helper behavior

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

Unicode NFKC normalization and unsafe path/control-character removal are shared. Each feature retains segment selection and order.

### CSV

```ts
csvCell(value, options?)
csvRow(values, options?)
spreadsheetSafeText(value)
```

Accepted feature policies remain intentionally different:

```text
History: quote always, apostrophe spreadsheet safety
Channel: quote minimal, spreadsheet safety none
```

### Numeric values

```ts
finiteNumberOrBlank(value)
finiteNumberOrNull(value)
```

Only finite JavaScript numbers are accepted. Numeric strings are not coerced.

### Clipboard and download

The neutral helpers own transport and neutral results only. Features retain fallback UX, exception semantics, timing, and visible feedback when exact behavior differs.

## 5. Completed PR sequence

### R0 — current implementation and boundary audit

```text
PR #409
branch: work-report-export-r0-audit
merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487
```

Completed:

- inventoried History and Channel output code and gates;
- compared filenames, CSV, JSON, clipboard, download, PNG, feedback, DOM, and request behavior;
- fixed the neutral shared boundary and the R1–R4 sequence.

### R1 — neutral shared output primitives

```text
PR #410
branch: work-report-export-r1-shared-output
merge: 6b90c277460a674e355a7676444ddf10ff296325
```

Completed:

- created neutral provider, filename, CSV, finite-value, clipboard, download, and result modules;
- added direct executable contracts;
- changed no History or Channel runtime output.

### R2 — conditional History internal adoption

```text
PR #411
branch: work-report-export-r2-history-adoption
merge: 9bd7df7620c87c48e5c2d2834cfdce712ad71e3e
```

Adopted:

```text
finiteNumberOrNull
CSV quote: always
CSV spreadsheetSafety: apostrophe
History-owned filename composition
```

Preserved:

- `viewloom-history-export-v1`;
- complete CSV, JSON, report, short-post, and filename output;
- visible-preview clipboard fallback;
- current temporary anchor and 1000 ms revoke timing;
- PNG/share-card behavior;
- one provider History response;
- History DOM, CSS, action order, labels, and visible status.

Provider display, clipboard transport, and text-download transport remained feature-owned.

### R3 — conditional Channel internal adoption

```text
PR #412
branch: work-report-export-r3-channel-adoption
merge: 83a46d286c90a9be503d7110b71b382f0394288e
```

Adopted:

```text
finiteNumberOrBlank
finiteNumberOrNull
CSV quote: minimal
CSV spreadsheetSafety: none
Channel-owned filename composition
```

Preserved:

- complete Full summary and Short post text;
- `viewloom-channel-v1`;
- complete CSV and JSON output;
- explicit absence of formula protection;
- provider-specific filenames;
- clipboard API and textarea fallback;
- hidden temporary anchor and zero-millisecond revoke timing;
- one provider History request per period;
- Channel DOM, CSS, task order, labels, and visible feedback.

Provider display, clipboard transport, and text-download transport remained feature-owned.

### R4 — cross-page regression and documentation closure

```text
PR #413
branch: work-report-export-r4-acceptance
```

Completion requirements:

- rerun complete affected History and Channel gates;
- verify provider separation, filenames, schemas, CSV policies, JSON missing values, report text, fallback behavior, and request counts;
- verify no visible layout change;
- finalize the permanent acceptance record;
- delete and unlink the temporary R0 audit note;
- advance roadmap and schedule to Phase 5.

## 6. Preservation matrix

| Contract | History | Channel |
|---|---:|---:|
| provider separation | preserved | preserved |
| no extra History request | preserved | preserved |
| exact report text | preserved | preserved |
| exact short-post text | preserved | preserved |
| exact CSV header and row meaning | preserved | preserved |
| exact filename | preserved | preserved |
| spreadsheet policy | apostrophe required | none; unchanged |
| JSON schema | `viewloom-history-export-v1` | `viewloom-channel-v1` |
| JSON missing numerics | preserved | `null` |
| PNG/share card | preserved | not applicable |
| DOM/CSS/layout | unchanged | unchanged |
| failure feedback | unchanged | unchanged |

## 7. Explicit non-goals

Phase 4 did not include:

- new report modes or export formats;
- Channel PNG/share cards;
- cross-platform combined output;
- shared report prose or JSON schemas;
- History or Channel visual redesign;
- API or storage changes;
- collector, cron, or retention changes.

## 8. Completion result

This plan is complete and retained as the permanent implementation record.

The former R0 temporary audit was removed in PR #413 after all stable decisions and evidence moved into this plan, the R1–R3 contracts, and the permanent acceptance record.

History UI appearance work remains a separate pending item and requires screenshots, explicit instructions, a new audit, and its own acceptance sequence.
