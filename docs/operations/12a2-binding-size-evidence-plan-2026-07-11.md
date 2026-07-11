# 12A-2 binding-based D1 size evidence plan

Date: 2026-07-11
Status: implementation candidate

## Purpose

Use the existing production-bound `/api/data-audit` query to expose current D1 database size from `D1Result.meta.size_after`, avoiding the blocked Cloudflare control-plane credential path.

## Evidence boundary

Cloudflare documents `D1Result.meta.size_after` as the database size after a successful query. The production audit endpoint already executes one aggregate query against each provider database.

The implementation therefore:

```text
reuses the existing query
adds no new D1 scan
adds no new cron
adds no migration
adds no retention change
returns size_after for Twitch and Kick separately
```

## Production acceptance

After merge and deployment:

```text
GET /api/data-audit
```

must return, for both providers:

```text
databaseSizeEvidence = d1_result_meta_size_after
databaseSizeBytes > 0
databaseSizeMb > 0
auditQuery.rowsWritten = 0
```

The observed production values will then be frozen into a 12A-2 remote-size gate artifact and compared with the accepted safe rollup projections.
