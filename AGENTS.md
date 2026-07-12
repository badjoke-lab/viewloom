# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 baseline: complete PR #490
12A-1 field contract: complete PR #492
12A-2 design/migration/deploy/schema: accepted through PR #506
12A-3 storage/execution/generator/accumulation: complete through PR #511
12A-4 category source audit: accepted PR #513
Production intraday generation: enabled and accumulating
Current workstream: 12A-4 provider-specific category storage design and budget gate
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
docs/audits/12a2-current-gate-state.json
docs/operations/12a4-category-source-audit-2026-07-12.md
```

Accepted provider-specific source fields:

```text
Twitch: game_id / game_name from Helix /streams
Kick: category.id / category.name from official public/v1/livestreams
category contract version: category-source-v1
cross-provider category identity: forbidden
combined-provider category ranking: forbidden
```

The next branch may compare storage models and establish a category storage/query budget. It must preserve the existing five-minute collector cadence, raw retention, intraday generation, provider separation, and collector outcome. It may not add migration or runtime capture until the design and budget are accepted.

No backfill, new high-frequency cron, category UI, exact-session claim, direct D1 execute, public DDL route, or cross-provider category analysis is authorized.
