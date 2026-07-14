# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design/migration/deploy/schema: accepted through PR #506
12A-3 storage/execution/generator/accumulation: complete through PR #511
12A-4 category source audit: accepted PR #513
12A-4 category storage design: accepted PR #514
12A-4 category migration and disabled runtime: accepted through PR #518
Production intraday generation: enabled and accumulating
Current workstream: 12A-4 production category execution-cost probe
Category runtime capture started: no
```

Permanent authorities:

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a3-generator-enablement-evidence.json
docs/audits/12a3-postmerge-acceptance-evidence.json
docs/audits/12a4-category-source-audit-contract.json
docs/audits/12a4-category-source-audit-evidence.json
docs/audits/12a4-category-storage-design-contract.json
docs/audits/12a4-category-storage-budget-evidence.json
docs/audits/12a4-category-migration-runtime-contract.json
docs/audits/12a4-disabled-runtime-postmerge-evidence.json
docs/audits/12a4-category-execution-cost-probe-contract.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a4-category-source-audit-2026-07-12.md
docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md
```

Accepted provider-specific source fields:

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from official public/v1/livestreams
category contract version: category-source-v1
cross-provider category identity: forbidden
combined-provider category ranking: forbidden
```

Accepted provider-specific storage and disabled-runtime state:

```text
selected model: embedded_hourly
raw category ids: stored once per snapshot
raw item references: item-order-aligned categoryRefs
category names: provider_category_dictionary
long-term category evidence: compact hourly JSON in existing streamer/day rows
new category index: no
raw-retention extension: no
repository migration candidate: implemented
production category schema: absent
CATEGORY_CAPTURE_ENABLED: absent
production category capture: disabled
```

The current branch may prepare the provider-separated production execution-cost gate. It may add read-only preflight inspection, local controlled-migration and idempotency fixtures, explicit thresholds, stop conditions, cleanup rules, and dry-run bundles.

It may not deploy a production Worker, apply the migration remotely, commit a production category-enable flag, write production category rows, add backfill, add a new cron, extend raw retention, add category UI, infer exact sessions or category switch times, use direct D1 execute in the planning PR, add a public DDL route, or create cross-provider category analysis. A separate evidence-bearing gate is mandatory before remote migration or runtime enablement.
