# Phase 12A-4 bounded category execution-cost probe

Status: accepted and retired; provider-separated category capture enablement decision is the current gate  
Tracking issue: #519  
Planning PR: #520  
Read-only preflight acceptance PR: #523  
Post-apply schema audit acceptance PR: #545  
Schema execution retirement PR: #546  
Bounded probe package PR: #547  
Production execution hardening PR: #551  
D1 compatibility fix PR: #555  
Accepted trigger PR: #557  
Accepted evidence PR: #558  
Production path retirement PR: #559  
Umbrella contract: `docs/audits/12a4-category-execution-cost-probe-contract.json`  
Execution contract: `docs/audits/12a4-category-execution-cost-probe-execution-contract.json`  
Accepted evidence: `docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json`

## Accepted result

```text
Twitch category schema complete
Kick category schema complete
Twitch provider gate passed
Kick provider gate passed
provider order preserved: Twitch then Kick
first dictionary pass changes: 1 per provider
second dictionary pass changes: 0 per provider
reserved probe rows created: 3 per provider
reserved probe rows remaining after cleanup: 0
provider leakage rows: 0
database size delta: 0 bytes per provider
natural snapshot observed after each provider probe
temporary Workers deleted and final HTTP status 404
CATEGORY_CAPTURE_ENABLED remains absent
production category rows remain absent
runtime capture enablement remains unauthorized
```

## Accepted production measurements

| Metric | Twitch | Kick |
| --- | ---: | ---: |
| Category generator queries | 4 | 4 |
| D1 statements | 10 | 10 |
| D1 rows read | 7 | 7 |
| D1 rows written during bounded probe and cleanup | 10 | 10 |
| D1 changes | 6 | 6 |
| D1 SQL duration | 1.743 ms | 1.417 ms |
| Worker wall time | 2010 ms | 1760 ms |
| Collector latency delta | 942 ms | 9 ms |
| Database size delta | 0 bytes | 0 bytes |
| Cleanup remaining rows | 0 | 0 |
| Provider leakage rows | 0 | 0 |

These values describe the accepted one-time reserved probe. They do not authorize continuous category capture by themselves.

## Completed sub-gates

```text
category source audit accepted
embedded-hourly storage design accepted
repository migration candidate implemented
production category schema applied for Twitch and Kick
disabled runtime accepted after merge
read-only production preflight accepted
schema execution and recovery paths retired
bounded probe package accepted
Worker readiness retry validated
D1-compatible direct VALUES dictionary upsert validated
attempt 1 stopped before probe execution
attempt 2 stopped with zero writes and complete cleanup
attempt 3 passed for Twitch and Kick
sanitized accepted evidence frozen
one-time trigger consumed and retired
production push trigger removed
production execution job removed
Cloudflare secret references removed from the retired workflow
```

## Retired execution boundary

```text
trigger status: consumed_and_retired
trigger rearm authorized: no
production push trigger present: no
production execution job present: no
Cloudflare credentials referenced by retired workflow: no
production Worker deployment from retired workflow: no
verification-only Worker bundles: dry-run
remote schema apply: no
category capture enablement: no
persistent production category rows: no
new cron: no
backfill: no
raw-retention change: no
category analytics UI: no
cross-provider category identity: no
combined-provider category ranking: no
```

## Current gate: provider-separated category capture enablement decision

The cost measurement is complete. The current task is not to run another probe and not to enable capture automatically. A separate decision package must determine whether the measured provider-specific cost, storage projection, collector safety, and free-tier operating margin justify a disabled-by-default capture rollout.

The decision must preserve these rules:

```text
1. Twitch and Kick remain separate decisions and data paths.
2. No cross-provider category identity is introduced.
3. No combined-provider category totals or rankings are introduced.
4. CATEGORY_CAPTURE_ENABLED remains absent until a separate accepted implementation gate.
5. No backfill is included with initial enablement.
6. No new cron is added.
7. Collector success must not be replaced by optional category failure.
8. Runtime and storage budgets must use the accepted production measurements, not fixture estimates alone.
9. A rollback/disable path must exist before any production flag is introduced.
10. Production evidence must remain provider-separated and sanitized.
```

## Current boundary

```text
accepted production cost evidence exists
all probe execution paths are retired
no CATEGORY_CAPTURE_ENABLED value
runtime category capture not authorized
runtime category capture not started
no persistent production category rows
no new cron
no backfill
no raw-retention change
no category analytics UI
no cross-provider category identity
no combined-provider category totals or rankings
```

## Next completion gate

The next gate is complete only when a separate provider-separated enablement decision explicitly accepts or rejects runtime category capture using the frozen production cost evidence. A positive decision still does not enable capture; it may only authorize a separate disabled-by-default implementation package. Until that later package is accepted, category capture remains disabled.
