# TEMPORARY — ViewLoom Report & Export shared-layer R0 audit

Status: active temporary audit
Created: 2026-06-24
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation
Branch: `work-report-export-r0-audit`
Delete when: Phase 4 production/regression closure is complete and stable contracts have moved into permanent documentation.
Permanent implementation plan: `../product/report-export-consolidation-plan.md`

## 1. Purpose

This audit records the current History and Channel report/export implementations before any shared runtime layer is introduced.

R0 is documentation-only. It must not change:

- History or Channel visible output;
- History or Channel DOM or CSS;
- report text or short-post wording;
- CSV headers, row meaning, escaping, line endings, or missing-value behavior;
- JSON schemas or field names;
- PNG/share-card behavior;
- provider separation;
- API requests, D1, bindings, collectors, cron, or retention.

The audit answers:

1. Which responsibilities are duplicated?
2. Which responsibilities can be shared without changing product semantics?
3. Which responsibilities must remain feature-specific?
4. Where do History and Channel intentionally differ?
5. What exact PR sequence can consolidate the safe layer without touching the pending History UI revision?

## 2. Accepted product boundaries

### History

History is the provider-specific retained period analysis surface.

Accepted workspace:

```text
Full report
Short post
Copy
Preview share card
Download PNG
Download CSV
Download JSON
```

History keeps:

- schema `viewloom-history-export-v1`;
- its accepted report and short-post text;
- its current CSV header and spreadsheet-safety behavior;
- explicit missing daily rows;
- provider/period/metric/date filename semantics;
- 1200 × 630 browser-generated PNG;
- one existing provider History response for all outputs.

### Channel

Channel is the provider-specific retained daily Top 10 footprint for one channel identity.

Accepted workspace:

```text
Full summary
Short post
Copy summary
Download CSV
Download JSON
```

Channel keeps:

- schema `viewloom-channel-v1`;
- one CSV row per requested day;
- explicit `retained_top10` state;
- blank missing CSV numeric cells;
- JSON `null` for missing numeric values;
- provider/channel/period filename semantics;
- no PNG/share-card in Channel v1;
- one existing provider History response for all outputs.

## 3. Current implementation inventory

### 3.1 History runtime

Primary files:

```text
apps/web/src/live/history-report-text.ts
apps/web/src/live/history-report-text-render.ts
apps/web/src/live/history-share-card.ts
apps/web/src/live/history-export.ts
apps/web/src/history-report-text.css
apps/web/src/history-share-card.css
```

Current responsibilities:

| Responsibility | Current owner |
|---|---|
| report/short-post text | History report model/render modules |
| text mode state | `history-report-text-render.ts` |
| clipboard action/status | History report renderer |
| CSV model/serialization | `history-export.ts` |
| JSON model/serialization | `history-export.ts` |
| CSV/JSON download action | `history-export.ts` |
| PNG model/drawing/download | `history-share-card.ts` |
| unified action DOM | `history-report-text-render.ts` |
| visible layout | History-specific CSS |
| payload reuse | History payload capture/entry layer |

Permanent and milestone contracts:

```text
apps/web/docs/history-report-export-h4-contract.md
apps/web/scripts/verify-history-report-export-h4.mjs
apps/web/scripts/history-report-export-h4-browser.mjs
apps/web/scripts/history-export-browser.mjs
apps/web/scripts/history-share-card-browser.mjs
.github/workflows/history-report-export-h4.yml
.github/workflows/history-report-export-h4-browser.yml
```

The H4 contract explicitly requires unchanged text, PNG, CSV, and JSON output contracts and prohibits another History request.

### 3.2 Channel runtime

Primary files:

```text
apps/web/src/live/channel-report.ts
apps/web/src/channel-report.css
apps/web/twitch/channel/index.html
apps/web/kick/channel/index.html
```

Current responsibilities inside `channel-report.ts`:

| Responsibility | Current owner |
|---|---|
| report/short-post text | local functions |
| text mode state | local module state |
| provider label | local Twitch/Kick ternary |
| period label fallback | local function/context construction |
| payload capture | wrapper around the existing provider History fetch |
| CSV model/serialization | local functions |
| JSON model/serialization | local functions |
| filename construction | local function |
| clipboard action/fallback | local function |
| Blob download action | local function |
| finite number to blank/null | local functions |
| feedback state | local DOM function |
| visible workspace | local DOM template and Channel CSS |

Permanent and browser contracts:

```text
apps/web/scripts/channel-report-browser.mjs
.github/workflows/channel-report-browser.yml
docs/product/channel-and-streamer-spec.md
docs/operations/channel-production-acceptance-2026-06-23.md
```

Channel production acceptance verifies provider-specific copy/CSV/JSON, one History request, provider-safe filenames, 390px behavior, and no page-level overflow.

## 4. Current data flow

### History

```text
provider History response
  -> History report payload capture
  -> report text model
  -> export model
  -> share-card model
  -> existing DOM/actions
```

The History export and share modules must not fetch. All output is derived from the current provider response.

### Channel

```text
provider History response
  -> cloned response captured by channel-report.ts
  -> Channel report context
  -> report text / CSV / JSON
  -> existing DOM/actions
```

Task switching, copy, CSV, and JSON do not issue another provider request.

### Data-flow conclusion

Payload capture and feature models are not shared-layer candidates. They belong to their feature because History and Channel derive different facts and have different state lifecycles.

## 5. Comparison matrix

| Concern | History | Channel | R0 decision |
|---|---|---|---|
| provider type | Twitch/Kick type in History modules | `ChannelProvider` | shared neutral provider type is safe |
| provider display label | local conversion | local conversion | safe shared pure helper |
| period key | History period model | `7d` / `30d` | type cannot be globally narrowed; share formatting only with explicit input |
| period label | History period helper | payload label with fallback | conditionally share formatter, preserve exact strings |
| source/state labels | History-specific copy | raw source/state in text | do not normalize output silently |
| coverage label | History period coverage language | observed/requested day text | feature-specific text; shared numeric formatter only |
| report text | accepted History wording | accepted Channel wording | never share templates |
| short post | max 280 code points | Channel retained-footprint sentence | never share templates |
| CSV schema | History retained daily schema | Channel daily channel schema | never share headers or row models |
| CSV quoting | local serializer | local `csvCell` | safe shared serializer after parity tests |
| spreadsheet formula safety | existing History contract | no equivalent explicit Channel contract | do not silently merge; make policy explicit before Channel adoption |
| missing CSV numeric values | History contract-specific | blank | shared finite-number-to-blank helper is safe |
| JSON schema | `viewloom-history-export-v1` | `viewloom-channel-v1` | never share schemas/builders |
| missing JSON numeric values | `null` | `null` | shared finite-number-to-null helper is safe |
| filename shape | provider/period/metric/date | provider/channel/period | share sanitization/composition only, not segment selection |
| clipboard write | browser clipboard plus fallback | browser clipboard plus fallback | safe shared transport helper |
| text download | Blob/anchor/object URL | Blob/anchor/object URL | safe shared transport helper |
| PNG | History only | intentionally absent | remain History-specific |
| feedback copy | History action-specific | Channel action-specific | share result type, not visible messages |
| DOM selectors | History-specific | Channel-specific | never share in Phase 4 foundation |
| CSS/layout | accepted History UI | accepted Channel UI | explicitly excluded |
| payload capture | History entry/capture | Channel fetch wrapper | feature-specific |

## 6. Verified duplication

The following logic is duplicated in concept and is suitable for a neutral shared layer:

1. provider union and provider display name;
2. safe filename-segment normalization;
3. ordered filename composition with an explicit extension;
4. RFC-style CSV quote escaping for commas, quotes, CR, and LF;
5. finite number to blank string;
6. finite number to `null`;
7. browser clipboard write with fallback;
8. browser text-file download through Blob/object URL/temporary anchor;
9. operation success/failure result shape for feature-owned feedback copy.

The shared layer must not know:

- History or Channel model types;
- API endpoints;
- routes or query parameters;
- DOM selectors;
- report modes;
- feature schema names;
- CSV headers;
- feature limitations;
- PNG canvas details.

## 7. Important mismatches and risks

### 7.1 CSV spreadsheet safety is not currently equivalent

History has an accepted spreadsheet-safety contract. Channel currently quotes CSV syntax but does not have the same explicit formula-cell policy.

Decision:

- R1 may expose an explicit `spreadsheetSafe` option or separate helper;
- History adoption must preserve its current behavior exactly;
- Channel must not opt into changed output silently;
- any Channel output change requires a separate contract update and browser assertion.

### 7.2 Filename sanitization inputs differ

Channel ids are normalized before filename construction. History filenames use different period/metric/date inputs. A single hard-coded filename helper would erase feature semantics.

Decision:

- share segment sanitization and composition;
- keep segment selection and ordering in each feature;
- preserve all accepted filenames through exact tests.

### 7.3 Visible status messages differ

History has separate report/share/export statuses. Channel has one report feedback region.

Decision:

- share only an internal result type or transport error normalization;
- keep visible copy and DOM ownership feature-specific.

### 7.4 History UI is pending separate revision

The current History DOM and CSS are accepted but visually pending new screenshots/instructions.

Decision:

- no Phase 4 PR may alter History DOM, CSS, action order, labels, or layout as a side effect of consolidation;
- R2 is conditional and may be deferred entirely;
- shared helper work can proceed independently.

### 7.5 Channel report module is broad

`channel-report.ts` owns capture, context, text, serialization, download, clipboard, and UI feedback. Extracting everything at once would create an unsafe large diff.

Decision:

- R3 adopts only already-tested neutral helpers;
- model construction and visible rendering remain in Channel;
- module decomposition beyond output helpers is not part of Phase 4.

## 8. Shared-layer target boundary

Provisional path:

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

The exact file count may be reduced in R1, but the dependency direction is fixed:

```text
shared/output -> browser and primitive TypeScript APIs only
History       -> shared/output
Channel       -> shared/output
shared/output -X-> History or Channel
```

Provisional public functions:

```ts
type OutputProvider = 'twitch' | 'kick'

type OutputOperationResult =
  | { ok: true }
  | { ok: false; message: string }

providerDisplayName(provider)
sanitizeFilenameSegment(value)
buildOutputFilename(parts, extension)
csvCell(value, options?)
csvRow(values, options?)
finiteNumberOrBlank(value)
finiteNumberOrNull(value)
writeTextToClipboard(text)
downloadTextFile({ name, content, mimeType })
```

These are provisional signatures. R1 must freeze them with tests before feature adoption.

## 9. Required preservation tests

### Shared helper tests

- Twitch and Kick labels;
- empty and unsafe filename segments;
- Unicode filename input;
- comma, quote, CR, and LF CSV escaping;
- optional spreadsheet-safety behavior;
- finite, `NaN`, infinity, missing, and string number values;
- clipboard API path;
- clipboard fallback path;
- object URL creation and revocation;
- download filename and MIME type.

### History preservation

- exact report and short-post text remains unchanged;
- short post remains within its accepted limit;
- exact CSV header and row semantics remain unchanged;
- exact JSON schema remains `viewloom-history-export-v1`;
- current PNG filename and 1200 × 630 drawing remain unchanged;
- no extra History request;
- no DOM/CSS/layout/action-label change;
- Twitch and Kick remain separated.

### Channel preservation

- exact report and short-post output remains unchanged;
- exact CSV header remains unchanged;
- blank CSV missing numeric cells remain blank;
- exact JSON schema remains `viewloom-channel-v1`;
- JSON missing numeric values remain `null`;
- current provider/channel/period filenames remain unchanged;
- no extra History request;
- no DOM/CSS/layout/action-label change;
- Twitch and Kick remain separated.

## 10. PR sequence fixed by R0

### R1 — neutral shared output primitives

Suggested branch:

```text
work-report-export-r1-shared-output
```

Scope:

- add the neutral shared output modules;
- add direct static/unit-style contract verification;
- add no History or Channel imports to the shared layer;
- do not migrate either feature;
- do not change visible or serialized output.

### R2 — conditional History internal adoption

Suggested branch:

```text
work-report-export-r2-history-adoption
```

Entry condition:

- exact History output snapshots/contracts exist for every helper being replaced;
- no DOM/CSS or visible string change is needed.

Scope:

- replace only neutral provider/filename/CSV/value/clipboard/download internals;
- retain History models, serializers, schema, report text, share card, statuses, DOM, and CSS;
- defer any unsafe adoption rather than broadening the PR.

### R3 — Channel internal adoption

Suggested branch:

```text
work-report-export-r3-channel-adoption
```

Scope:

- replace only neutral helpers covered by preservation tests;
- retain Channel context, report text, CSV rows, JSON schema, statuses, DOM, and CSS;
- make spreadsheet-safety policy explicit before changing Channel CSV bytes.

### R4 — cross-page regression and documentation closure

Suggested branch:

```text
work-report-export-r4-acceptance
```

Scope:

- run History and Channel text/export/browser matrices;
- verify provider separation and request counts;
- verify exact accepted filenames and schemas;
- verify no visible layout changes;
- update permanent plan/roadmap/schedule;
- delete this temporary audit note.

No Cloudflare Preview is required when R1–R4 remain internal and output-compatible. Preview becomes mandatory if any accepted browser-visible or serialized contract changes.

## 11. R0 result

R0 finds a valid consolidation path, but only below the feature model and UI layers.

Proceed:

- neutral provider formatting;
- filename sanitization/composition;
- CSV syntax helpers;
- finite blank/null helpers;
- clipboard and download transport;
- internal operation result types.

Do not proceed:

- shared report templates;
- shared JSON builders;
- shared CSV row models;
- shared coverage wording;
- shared DOM/CSS;
- shared payload capture;
- moving History PNG into a generic feature;
- any History visual change.

Next executable step after R0 merge:

```text
R1 — neutral shared output primitives
branch: work-report-export-r1-shared-output
```
