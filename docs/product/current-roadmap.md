# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-14

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 collection safety and raw retention controls.
- 12A-1 daily rollup, pruning, and history integration.
- 12A-2 intraday rollups with provider-separated schema and controlled apply.
- 12A-3 bounded aggregate generation, execution-cost acceptance, enablement, and post-merge accumulation.
- 12A-4 category source audit: Twitch `game_id/game_name`, Kick `category.id/category.name`.
- 12A-4 category storage design: embedded hourly category summaries.
- 12A-4 repository migration and disabled runtime implementation.
- 12A-4 read-only production preflight.
- 12A-4 controlled schema design, provider-specific recovery, and final post-apply audit.
- Twitch and Kick production category schemas are both complete.
- All schema execution and recovery triggers are consumed and retired.

### Current gate: 12A-4-5 bounded provider-separated category execution-cost probe design

The current work is **not** runtime capture enablement. It is a bounded one-shot probe package that must:

- read accepted schema evidence from `main`;
- operate on Twitch and Kick independently;
- use only reserved probe identifiers;
- measure D1 reads, writes, changes, SQL duration, Worker wall time, database size, and collector latency;
- prove the dictionary second pass is a no-op;
- remove every reserved probe row and dictionary entry;
- prove provider leakage is zero;
- delete temporary Workers and verify HTTP 404;
- leave `CATEGORY_CAPTURE_ENABLED` absent.

### Next gate: 12A-4-6 bounded probe execution and acceptance

A production probe may run only after a package PR passes local fixtures, dry-runs, evidence verification, and scope checks. The production trigger must be a separate one-file PR. Twitch completes and cleans up before Kick starts.

### Later decision: category capture enablement

Runtime capture remains unauthorized until bounded cost evidence is accepted. Enablement, if justified, requires a separate contract, trigger, post-merge observation, and rollback boundary.

## Hard boundaries

- Twitch and Kick remain separate data products.
- Cross-provider category identity and combined category rankings are not allowed.
- No new cron is authorized.
- No backfill is authorized.
- Raw-retention windows do not change in 12A-4.
- Category schema columns are preserved; incident response disables runtime instead of dropping columns.
- Free-tier safety takes precedence over feature breadth.

## Canonical evidence

- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- `docs/audits/12a4-category-execution-cost-probe-contract.json`
- `docs/work-in-progress/phase12a4-category-execution-cost-probe.md`

## Deferred product expansion

Public feature expansion, category analytics UI, additional platforms, aggressive retention, and cross-provider comparison remain deferred until the free-tier production gates are complete.
