# ViewLoom U10A cross-site quality baseline

Status: active
Phase: 10
Branch: `work-quality-u10a-baseline`
Created: 2026-06-29
Entry main commit: `3ad171002ca908f8cf05e458c40009f88fdc6df4`
Permanent specification: `../product/cross-site-quality-remediation-spec.md`
Implementation plan: `../product/cross-site-quality-remediation-plan.md`

## Purpose

U10A records the reproducible non-History quality baseline before repair. It does not authorize product repair except proven P0 isolation.

Required outputs:

- classified defect ledger;
- authoritative and legacy owner map;
- route/provider/viewport/state/gate records;
- static repository verifier;
- deterministic browser evidence;
- exact handoff to U10B.

## Active findings under reproduction

```text
Day Flow UTC date accessible name
Day Flow first-render layout coherence
Watchlist Public Readiness ownership
Production Smoke route ownership
Channel no-id entry behavior
Battle Lines recommended/default pair ownership
Battle Lines selected-time coherence
Cross-route mobile target sizes
```

## Fixed boundaries

- Twitch and Kick remain separate.
- No new API, D1 schema, binding, collector field, cron, retention, or output schema.
- No localization runtime.
- No product repair in this branch except proven P0 isolation.
- Existing History acceptance remains unchanged.

## Evidence ownership

```text
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
apps/web/scripts/quality-u10a-baseline-browser.mjs
scripts/verify-quality-u10a-baseline.mjs
.github/workflows/quality-u10a-baseline.yml
```

## Exit condition

U10A closes only when the latest branch head passes repository verification, typecheck, build, deterministic browser evidence, provider-separation checks, and canonical-document checks. After merge, the temporary note remains only until canonical closeout transfers the result and names `work-quality-u10b-shell` as exact next.