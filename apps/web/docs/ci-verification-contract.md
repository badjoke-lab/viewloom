# Web CI Verification Contract

This page records the intended responsibility split for ViewLoom web CI.

## Workflows

- `Web build` verifies the Vite web build output.
- `Web checks` verifies repository-level web checks such as typecheck/build wrappers.
- `Web verification` verifies source contracts and page QA contracts that prevent mock/static regressions.

## Web verification scope

`Web verification` must keep running these checks from `apps/web`:

- `scripts/verify-production-source.mjs`
- `scripts/verify-heatmap-qa.mjs`
- `scripts/verify-dayflow-qa.mjs`
- `scripts/verify-battle-lines-qa.mjs`
- `scripts/verify-history-qa.mjs`
- `scripts/verify-status-qa.mjs`
- `scripts/verify-home-qa.mjs`
- `scripts/verify-content-qa.mjs`

## Source gate responsibility

`verify-production-source.mjs` is the broad production source gate. It should stay focused on:

- required public pages existing
- shared shell fragments existing
- expected `data-provider` values
- required live entry files connected to feature pages
- required source files existing
- dangerous mock/cutover/static-regression fragments not returning

It should not duplicate every page-specific QA rule. Detailed page contracts belong in the dedicated `verify-*-qa.mjs` scripts.

## Page QA responsibility

Dedicated QA scripts own page-level details:

- Heatmap owns viewport/current-shell regression checks.
- Day Flow owns dayflow controls, stage, and inspector checks.
- Battle Lines owns summary, feed, and missing/offline point checks.
- History owns retained history, notes, and demo-row regression checks.
- Status owns status board, feature table, and hard-coded freshness checks.
- Home owns portal/provider home shell checks.
- Content owns About/Support content, contact, and support policy checks.

## Artifacts

Verification logs should be uploaded as one artifact named `web-verification-logs`.

The artifact should include:

- `source-gate.log`
- `heatmap-qa.log`
- `dayflow-qa.log`
- `battle-lines-qa.log`
- `history-qa.log`
- `status-qa.log`
- `home-qa.log`
- `content-qa.log`

Do not add one artifact per QA page unless a specific debugging need appears. Keeping one artifact prevents the workflow from becoming noisy while preserving all failure logs.
