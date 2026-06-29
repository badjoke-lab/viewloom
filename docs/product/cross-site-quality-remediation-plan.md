# ViewLoom cross-site quality remediation plan

Status: active implementation plan
Version: 1.2
Last updated: 2026-06-29
Permanent specification: `cross-site-quality-remediation-spec.md`
Current branch: none
Completed phase: U10A through PR #454
Canonical closeout: PR #455
Exact next branch: `work-quality-u10b-shell`
U10B branch created: no

## Boundaries

Twitch and Kick remain separate. No new API, database schema, binding, collector field, cron, retention rule, or output schema is authorized. Reproduction and evidence precede repair.

## Sequence

```text
U10A work-quality-u10a-baseline complete PR #454
U10B work-quality-u10b-shell exact next after explicit continuation
U10C work-quality-u10c-visualization
U10D work-quality-u10d-analysis-coherence
U10E work-quality-u10e-responsive
U10F work-quality-u10f-readiness
U10G work-quality-u10g-architecture
U10H work-quality-u10h-acceptance
O11A work-operations-o11a-matrix
O11B work-operations-o11b-browser
O11C work-operations-o11c-workflows
O11D work-operations-o11d-app-types
O11E work-operations-o11e-server-types
O11F work-operations-o11f-runbooks
O11G work-operations-o11g-acceptance
```

U10A permanent evidence is stored in `docs/audits/cross-site-quality-u10a-baseline.json` and `docs/audits/cross-site-quality-u10a-owner-map.json`. The temporary working note is removed after canonical closeout.

After each merge, update canonical state, report, name the next branch, and stop.
