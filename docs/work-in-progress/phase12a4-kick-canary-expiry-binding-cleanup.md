# 12A-4 Kick canary expiry binding cleanup

## Status

Accepted and retired.

- cleanup package PR: #586
- cleanup package merge: `aaafab2266ef717b2e51dd5006044578bbfd8ae2`
- exact one-file cleanup trigger PR: #587
- cleanup trigger merge: `7fbc343207de235ae583e827ba2fa7796083faf4`
- final read-only acceptance job: `87822408236`
- final accepted artifact: `8399137444`

## Incident evidence

Post-rollback read-only acceptance run `29488056134`, job `87810458773`, artifact `8398761959` rejected one gate only:

- `canaryBindingsAbsent`: false

All other required conditions already passed:

- trigger expired;
- permanent direct `CATEGORY_CAPTURE_ENABLED` absent;
- normal authenticated non-empty Kick snapshots continued after expiry;
- category payload rows after the ten-minute grace boundary: `0`;
- provider leakage rows: `0`;
- schema and storage gates passed.

The remaining defect was stale service metadata: the five bounded canary plain-text bindings were not removed.

## Recovery performed

The recovery performed one operation only:

```text
pnpm dlx wrangler@4 deploy --config workers/collector-kick/wrangler.toml
```

It did not:

- restart category capture;
- add `CATEGORY_CAPTURE_ENABLED`;
- modify Twitch;
- change cron cadence;
- call a manual collection endpoint;
- run a migration or backfill;
- change retention;
- alter application UI or cross-provider behavior.

## Final acceptance

The independent post-rollback acceptance then passed:

- all canary bindings absent;
- no permanent direct category flag;
- newer fresh authenticated non-empty Kick snapshot observed;
- category payload rows after grace remained `0`;
- provider leakage remained `0`;
- current/projected/headroom storage gates passed;
- Twitch change: none.

The accepted sanitized evidence is frozen at:

`docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-evidence.json`

## Retirement

The one-time cleanup trigger is consumed and retired. The cleanup workflow no longer has a push event or production deployment job. It remains only as a retirement verifier and normal Kick dry-run gate.

Kick final observation and rollback are accepted. Twitch remains a separate decision and is not automatically started or authorized.
