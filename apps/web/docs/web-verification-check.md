# Web verification check

This file exists only to trigger the web verification workflow after the workflow was added.

Expected workflow steps:

- `pnpm --filter @viewloom/web verify:source`
- `pnpm --filter @viewloom/web typecheck`
- `pnpm --filter @viewloom/web build`
