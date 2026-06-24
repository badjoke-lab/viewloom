# ViewLoom Report & Export consolidation acceptance — 2026-06-24

Status: completed permanent record on PR #413 merge
Roadmap phase: Phase 4 — Report & Export shared-layer consolidation
Closure branch: `work-report-export-r4-acceptance`
Closure PR: #413

## 1. Accepted sequence

```text
R0  PR #409  boundary audit
    merge: 46cea2eceff85b4f5a359446d102d7bc6afe3487

R1  PR #410  neutral shared output primitives
    merge: 6b90c277460a674e355a7676444ddf10ff296325

R2  PR #411  exact-compatible History adoption
    merge: 9bd7df7620c87c48e5c2d2834cfdce712ad71e3e

R3  PR #412  exact-compatible Channel adoption
    merge: 83a46d286c90a9be503d7110b71b382f0394288e

R4  PR #413  regression and documentation closure
```

## 2. Accepted shared boundary

The neutral shared layer owns only:

```text
provider primitive
filename sanitization and composition
CSV syntax escaping
finite number -> blank
finite number -> null
clipboard transport with neutral result
text-file download transport with neutral result
operation result type
```

The following remain feature-owned:

```text
History and Channel models
payload capture and request lifecycle
report and short-post prose
CSV headers and row models
JSON schemas and builders
coverage and limitation wording
History PNG/share-card behavior
DOM selectors and HTML templates
CSS and responsive layout
visible success and error feedback
```

Dependency direction remains:

```text
History -> shared/output
Channel -> shared/output
shared/output must not import History or Channel
```

## 3. History acceptance preserved

R2 adopted only:

```text
finiteNumberOrNull
CSV quote: always
CSV spreadsheetSafety: apostrophe
History-owned filename segment order
```

Preserved exactly:

- schema `viewloom-history-export-v1`;
- complete CSV and JSON output;
- report and short-post text;
- Twitch and Kick filenames;
- visible-preview clipboard fallback;
- temporary download anchor and 1000 ms revoke timing;
- PNG/share-card behavior;
- one existing provider History response;
- History DOM, CSS, labels, action order, and visible status copy.

Provider display, clipboard transport, and text-download transport remain feature-owned because accepted fallback and timing behavior differ from the neutral helpers.

## 4. Channel acceptance preserved

R3 adopted only:

```text
finiteNumberOrBlank
finiteNumberOrNull
CSV quote: minimal
CSV spreadsheetSafety: none
Channel-owned filename segment order
```

Preserved exactly:

- complete Full summary and Short post text;
- schema `viewloom-channel-v1`;
- CSV header and requested-day rows;
- CRLF and UTF-8 BOM at download time;
- blank missing CSV numeric cells;
- minimal syntax quoting;
- no implicit spreadsheet formula protection;
- complete JSON and `null` missing numerics;
- Twitch and Kick filenames;
- clipboard API and textarea fallback;
- hidden temporary download anchor and zero-millisecond revoke timing;
- one provider History request per loaded period;
- no request when channel id is missing;
- Channel DOM, CSS, task order, labels, and visible feedback.

Provider display, clipboard transport, and text-download transport remain feature-owned because accepted failure paths throw and preserve caller-visible error messages.

## 5. Provider and data-path acceptance

For both History and Channel:

- Twitch and Kick remain separate in routes, requests, copy, exports, links, and filenames;
- no cross-provider combined output was introduced;
- output actions reuse the loaded provider response;
- no new API endpoint or request was introduced;
- no D1 schema, binding, collector, cron, or retention change was introduced.

## 6. Permanent contracts and gates

```text
apps/web/docs/shared-output-r1-contract.md
apps/web/docs/history-output-r2-contract.md
apps/web/docs/channel-output-r3-contract.md

apps/web/scripts/verify-shared-output-r1.mjs
apps/web/scripts/verify-history-output-r2.mjs
apps/web/scripts/verify-channel-output-r3.mjs

.github/workflows/shared-output-r1.yml
```

`Shared Output Contracts` executes app typechecking plus the R1, History R2, and Channel R3 contracts.

The existing History and Channel browser matrices remain the acceptance source for UI, provider separation, copy, download, request count, mobile, touch, and overflow behavior.

## 7. R4 closure conditions

PR #413 may merge only when:

- all output contracts pass;
- all affected History and Channel browser gates pass;
- Web, policy, naming, readiness, and Data Status gates pass;
- final diff contains no runtime, DOM, CSS, API, D1, collector, cron, retention, or serialized-output change;
- `docs/work-in-progress/report-export-r0-audit.md` is deleted and unlinked;
- roadmap and schedule advance to Phase 5.

## 8. Result

Phase 4 created a reusable neutral output layer while preserving intentional product differences. It did not standardize feature prose, schemas, spreadsheet policy, fallback UX, download timing, or visible layout merely to increase reuse.

History UI appearance revision remains pending separate screenshots and explicit instructions. Phase 4 does not authorize visual changes to History or Channel.
