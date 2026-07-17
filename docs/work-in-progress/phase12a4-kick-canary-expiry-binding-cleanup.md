# 12A-4 Kick canary expiry binding cleanup

## Status

Prepared. No production action occurs from this package pull request.

## Incident evidence

Post-rollback read-only acceptance run `29488056134`, job `87810458773`, artifact `8398761959` completed after all 120 polling attempts and rejected one gate only:

- `canaryBindingsAbsent`: false

All other required conditions passed:

- trigger expired;
- permanent direct `CATEGORY_CAPTURE_ENABLED` absent;
- normal authenticated non-empty Kick snapshots continued after expiry;
- category payload rows after the ten-minute grace boundary: `0`;
- provider leakage rows: `0`;
- schema and storage gates passed.

The expired wrapper is already producing normal payloads because its runtime window is closed. The remaining defect is stale service metadata: the five bounded canary plain-text bindings were not removed.

## Recovery boundary

The recovery performs one operation only when a separate exact one-file trigger is merged:

```text
pnpm dlx wrangler@4 deploy --config workers/collector-kick/wrangler.toml
```

It does not:

- restart category capture;
- add `CATEGORY_CAPTURE_ENABLED`;
- modify Twitch;
- change cron cadence;
- call a manual collection endpoint;
- run a migration or backfill;
- change retention;
- alter application UI or cross-provider behavior.

## Acceptance

The cleanup succeeds only when:

1. the exact attempt-3 category trigger is expired;
2. the cleanup trigger is valid and unexpired;
3. the production service has either the exact expired attempt-3 bindings or is already clean;
4. normal Kick configuration is the only deployed configuration;
5. all canary bindings are absent afterward;
6. no permanent direct category flag exists;
7. a newer fresh authenticated non-empty Kick snapshot is observed;
8. category payload rows after the grace boundary remain zero;
9. provider leakage remains zero.

Sanitized evidence is uploaded for every execution outcome.

## Sequence

1. Merge this dormant package.
2. Open and merge a separate pull request containing only `docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json`.
3. Inspect the cleanup evidence artifact.
4. Re-run the post-rollback read-only acceptance package.
5. Freeze accepted final evidence and advance the canonical gate.

Twitch remains blocked throughout this sequence.
