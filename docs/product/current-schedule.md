# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-14

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 intraday design/migration/deploy/schema complete through PR #506
12A-3 bounded generation and accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 migration and disabled runtime accepted through PR #518
12A-4 read-only preflight accepted PR #523
12A-4 provider category schemas complete and post-apply audited PR #545
Schema execution/recovery triggers retired yes
Current gate 12A-4-5 bounded provider-separated category execution-cost probe design
Category runtime capture started no
CATEGORY_CAPTURE_ENABLED present no
Production category rows present no
```

## Active sequence

1. Build the bounded probe package with local success/failure/cleanup fixtures.
2. Verify accepted Twitch/Kick schema evidence directly from `main`.
3. Prove reserved identifiers, provider separation, query bounds, and guaranteed cleanup.
4. Run PR scope, evidence, typecheck, and Wrangler dry-run gates without Cloudflare credentials.
5. Merge the package without production execution.
6. Open a separate one-file production trigger PR.
7. Execute Twitch, clean it completely, and verify zero rows before Kick starts.
8. Execute Kick, clean it completely, and verify zero rows.
9. Freeze sanitized cost evidence and retire the probe trigger/workflow.
10. Make a separate category capture enablement decision.

## Stop conditions

Stop before the next provider or before runtime enablement when any of the following occurs:

- accepted schema evidence is missing or either provider is not complete;
- a provider binding mismatch or foreign-provider row is detected;
- a non-reserved probe identifier is requested;
- query count, Worker time, database-size change, or collector-latency delta exceeds the contract;
- dictionary second-pass changes are nonzero;
- cleanup leaves any reserved row or dictionary entry;
- temporary Worker deletion does not return HTTP 404;
- `CATEGORY_CAPTURE_ENABLED` appears before a separate enablement acceptance.

## Deferred until the gate passes

- production category capture;
- category analytics UI;
- category backfill;
- retention expansion;
- cross-provider category identity;
- combined Twitch/Kick category rankings.
