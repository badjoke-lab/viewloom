# Phase 12A-4 controlled category schema apply execution package

Status: implementation package; production trigger not armed  
Tracking issue: #519  
Design PR: #528  
Design merge SHA: `21be04c8532d9b20ec22f29af6658a2d926b78a1`

## Purpose

Build the one-time, provider-separated production schema-apply workflow and evidence package without executing it from this PR.

## This package adds

```text
provider-aware pre/post operational inspection
schema and DB-size evidence
first apply and second-pass no-op evidence
natural snapshot interval baseline and post-apply interval evidence
Twitch-before-Kick sequential execution
stop-before-next-provider failure containment
sanitized success/failure artifact generation
temporary Worker deletion and post-delete HTTP 404 verification
exact main/design/package identity checks
separate future trigger file contract
```

## PR validation only

```text
scope verification
execution package verification
evidence fixture verification
Development policy
Twitch Wrangler dry-run
Kick Wrangler dry-run
no Cloudflare credentials
no production Worker deploy
no remote D1 schema apply
```

## Future trigger boundary

A later trigger PR must contain one file only: `docs/audits/12a4-category-controlled-schema-apply-trigger.json`. The trigger must pin this package PR and exact package head SHA, use confirmation `APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED`, and execute once from `main`.

## Failure containment

```text
Twitch executes before Kick
any Twitch failure prevents Kick execution
partial schema stops before DDL
applied schema is not dropped during incident response
category runtime remains disabled
no probe rows are written
all temporary Workers are deleted on success or failure
partial provider completion requires a separate recovery decision
```

## Completion condition

This package completes when all static, local, and Wrangler dry-run gates pass and the package is merged to `main`. Merge does not apply production schema. A separate one-time trigger PR is required.
