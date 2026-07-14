# Phase 12A-4 category migration and disabled runtime implementation

Status: accepted through PR #518  
Implementation PR: #516  
Production boundary acceptance: #517  
Accepted evidence frozen: #518

The provider-separated repository migration candidate and disabled-by-default runtime
implementation are complete. Production collector deployment was accepted while the
category schema and payload fields remained absent, `CATEGORY_CAPTURE_ENABLED` remained
absent, provider databases remained separate, and temporary verifier Workers were deleted.

The active workstream is now
`docs/work-in-progress/phase12a4-category-execution-cost-probe.md`.

Still unauthorized:

```text
remote category migration
production category capture
production category rows
backfill
new cron
raw-retention change
category analytics UI
cross-provider category identity
combined-provider category ranking
```
