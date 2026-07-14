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
12A-4 read-only production preflight: accepted PR #523
Production intraday generation: enabled and accumulating
Current workstream: 12A-4 controlled category schema apply design
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
docs/audits/12a4-category-readonly-preflight-evidence.json
docs/audits/12a4-category-controlled-schema-apply-contract.json
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

Accepted provider-specific storage and preflight state:

```text
selected model: embedded_hourly
raw category ids: stored once per snapshot
raw item references: item-order-aligned categoryRefs
category names: provider_category_dictionary
long-term category evidence: compact hourly JSON in existing streamer/day rows
new category index: no
raw-retention extension: no
repository migration candidate: implemented
disabled runtime production acceptance: complete
read-only production preflight acceptance: complete PR #523
production category schema: absent
CATEGORY_CAPTURE_ENABLED: absent
production category capture: disabled
```

The current branch may prepare the provider-separated controlled category schema apply design. It may add an exact migration-parity module, provider-separated temporary Worker candidates, inspect/apply routes protected by an explicit confirmation token, local absent/apply/no-op and partial-schema fixtures, explicit thresholds, stop conditions, deletion rules, and Wrangler dry-run bundles.

It may not deploy a production Worker, apply the category migration remotely, commit a production category-enable flag, write production category rows, add backfill, add a new cron, extend raw retention, add category UI, infer exact sessions or category switch times, use direct D1 execute in the design PR, add a public unauthenticated DDL route, or create cross-provider category analysis. A separate evidence-bearing one-time trigger gate is mandatory before remote schema application, bounded cost measurement, or runtime enablement.
