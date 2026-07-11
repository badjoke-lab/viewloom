# Phase 12A-2 binding-based remote size gate

Status: active production evidence path
Branch: `work-analytics-12a2-binding-size-gate`

## Purpose

Use `D1Result.meta.size_after` from the existing production `/api/data-audit` query to collect current provider-separated D1 database size evidence without Cloudflare control-plane repository secrets.

## Boundaries

```text
new D1 query no
new cron no
migration no
retention change no
cross-provider aggregation no
```

## Production acceptance

After merge and deployment, fetch `/api/data-audit` and require both provider records to report positive `databaseSizeBytes`, positive `databaseSizeMb`, evidence marker `d1_result_meta_size_after`, and `auditQuery.rowsWritten = 0`.

Observed values must be frozen before any 12A-2 migration branch is created.
