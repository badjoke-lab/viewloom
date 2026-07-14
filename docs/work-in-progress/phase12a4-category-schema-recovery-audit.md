# Phase 12A-4 category schema recovery read-only audit

Status: package candidate; no production trigger  
Tracking issue: #519  
Source attempt: PR #533 / `a83b412e479dccb36ad04541843e3dd9456e7dff`  
Source workflow run: `29325444378`

## Why this audit exists

Attempt 2 reached the provider execution step, but evidence normalization failed because an existing raw response file contained plain text `error code: 1104` instead of JSON. The source artifact was therefore not created.

Control flow proves that the Twitch provider gate passed before Kick was attempted. That makes a blind two-provider retry unsafe: Twitch may already have the complete category schema while Kick may still be absent.

## Audit purpose

Deploy temporary read-only provider-aware Workers, inspect Twitch and Kick independently, capture schema state without selecting stream payloads or identities, and delete both temporary Workers.

The audit records one of these schema states per provider:

```text
absent
complete
partial
unknown
```

`unknown` fails the audit. `absent`, `complete`, and `partial` are observations rather than assumptions; the next recovery package is chosen only after evidence is frozen.

## Required safety result

```text
read-only inspect only
D1 rows written = 0
D1 changes = 0
provider leakage = 0
temporary Worker absent before deploy
temporary Worker deleted after inspect
post-delete service status = HTTP 404
category capture remains disabled
no category rows, cron, backfill, retention change, UI, or cross-provider identity
```

## Package boundary

This branch adds the audit contract, evidence normalizer/verifier, workflow candidate, and hardens schema-apply evidence parsing. Pull-request jobs run only static checks and Wrangler dry-runs. A separate one-file trigger PR is required before the production read-only audit can run.
