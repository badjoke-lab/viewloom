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
