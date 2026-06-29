# ViewLoom cross-site quality remediation plan

Status: active implementation plan
Version: 1.4
Last updated: 2026-06-29
Permanent specification: `cross-site-quality-remediation-spec.md`
Current branch: none
Completed phase: U10B through PR #456
Completed canonical closeout: PR #457
Exact next branch: `work-quality-u10c-visualization`
U10C branch created: no

## Boundaries

Twitch and Kick remain separate. U10B changed only the common public shell and its acceptance evidence. No API, D1, binding, collector, cron, retention, output schema, localization runtime, or provider-combination change was made.

## Sequence

```text
U10A work-quality-u10a-baseline complete PR #454
U10B work-quality-u10b-shell complete PR #456
U10C work-quality-u10c-visualization exact next after explicit continuation
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

Permanent U10B record: `docs/audits/cross-site-quality-u10b-shared-shell.json`.

After each merge, update canonical state, report, name the next branch, and stop.
