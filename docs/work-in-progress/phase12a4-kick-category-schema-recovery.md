# Phase 12A-4 Kick-only category schema recovery

Status: package candidate; no production trigger  
Tracking issue: #519  
Accepted recovery audit: PR #537 / `56891f4d0441da2122fa130c7e7d8a3491ee2740`

## Proven precondition

```text
Twitch category schema: complete
Kick category schema: absent
Twitch reapply allowed: no
Kick recovery target: yes
category capture: disabled
```

The precondition is frozen in `docs/audits/12a4-category-schema-recovery-audit-evidence.json`.

## Recovery sequence

1. Verify the accepted audit evidence directly from `main`.
2. Require the temporary Kick recovery Worker name to be absent.
3. Deploy a Kick-only Worker bound only to `vl_kick_hot`.
4. Inspect Kick and require a completely absent category schema.
5. Apply exactly nine schema statements with an explicit Kick-only confirmation header.
6. Reapply once and require zero statements / already complete.
7. Wait for a new natural Kick snapshot and compare collector latency.
8. Require category dictionary rows, reserved probe rows, and provider leakage to remain zero.
9. Delete the temporary Worker and require HTTP 404.
10. Upload sanitized success or failure evidence.

## Hard boundary

The package has no Twitch D1 binding and no Twitch Wrangler config. It does not enable category capture, write category rows, add cron, backfill data, change retention, add category UI, or create cross-provider identity.
