# ViewLoom cross-site quality remediation plan

Status: active implementation plan
Version: 2.3
Last updated: 2026-07-03
Permanent specification: `cross-site-quality-remediation-spec.md`
Current branch: `work-quality-u10g-architecture`
Completed phase: U10C through PR #458
Completed canonical closeout: U10C through PR #459
Completed phase: U10D through PR #462
Completed canonical closeout: U10D through PR #464
Completed phase: U10E through PR #465
Completed canonical closeout: U10E through PR #466
Completed phase: U10F through PR #468
Completed canonical closeout: U10F through PR #469
Active phase: U10G architecture consolidation
Exact next branch: `work-quality-u10h-acceptance`
U10H branch created: no

Twitch and Kick remain separate. U10G consolidates Day Flow and Battle Lines into one authoritative feature controller per provider route. Layout, enhanced summary, request timeout, selected-time canonicalization, split-rail rendering, and degraded states are invoked explicitly by those controllers. Obsolete loading guards and feature coordination entries are removed. U10G does not claim production acceptance; U10H owns final production acceptance. No new APIs, storage, bindings, collectors, retention, output schemas, localization runtime, or provider combination are authorized.

```text
U10A complete PR #454
U10B complete PR #456
U10C complete PR #458
U10D complete PR #462
U10E complete PR #465
U10F complete PR #468
U10G work-quality-u10g-architecture active
U10H work-quality-u10h-acceptance exact next
```

Active U10G record: `docs/work-in-progress/u10g-architecture.md`.
Permanent U10F record: `docs/audits/cross-site-quality-u10f-readiness.json`.
