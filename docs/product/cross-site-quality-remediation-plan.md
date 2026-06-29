# ViewLoom cross-site quality remediation plan

Status: active implementation plan
Version: 1.5
Last updated: 2026-06-29
Permanent specification: `cross-site-quality-remediation-spec.md`
Current branch: `work-quality-u10c-visualization`
Completed phase: U10B through PR #456
Completed canonical closeout: PR #457
Active phase: U10C visualization
Exact next branch after U10C: `work-quality-u10d-analysis-coherence`
U10D branch created: no

## Boundaries

Twitch and Kick remain separate. U10C changes only visualization reading grammar, state presentation, accessible stage semantics, and acceptance evidence. It does not change recommendation ownership, selected-time ownership, APIs, D1, bindings, collectors, cron, retention, output schemas, localization runtime, or provider combination.

## Sequence

```text
U10A work-quality-u10a-baseline complete PR #454
U10B work-quality-u10b-shell complete PR #456
U10C work-quality-u10c-visualization active
U10D work-quality-u10d-analysis-coherence next after closeout
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

Active note: `docs/work-in-progress/u10c-visualization.md`.

After each merge, update canonical state, report, name the next branch, and stop.
