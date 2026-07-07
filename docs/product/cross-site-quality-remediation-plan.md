# ViewLoom cross-site quality remediation plan

Status: active implementation plan
Version: 2.7
Last updated: 2026-07-07
Permanent specification: `cross-site-quality-remediation-spec.md`
Current branch: `work-quality-phase11-acceptance-operations`
Completed phase: U10H production acceptance through PR #471
Completed canonical closeout: U10H through PR #472
Active phase: Phase 11 acceptance and operations
Current workstream: P11G final pre-merge acceptance

Twitch and Kick remain separate. Phase 11 is a quality, type-safety, CI, monitoring, runbook, and maintenance program. It does not authorize new APIs, storage, bindings, collectors, retention changes, localization runtime, or provider combination.

```text
P11A strict-null migration complete
P11B CI ownership and duplication decision complete
P11C monitoring contract complete; hosted evidence pending main merge
P11D failure runbook and escalation ownership complete
P11E maintenance cadence complete
P11F all-public acceptance ownership complete
P11G final pre-merge acceptance active
```

P11B decision: seven latest-head cancellation gaps were repaired. Thirty-two repeated named steps were classified. Named-step overlap alone retired zero workflows; future retirement requires named replacement assertions and passing evidence.

P11C–P11E use existing Status APIs and GitHub Actions. No new application cron or collector cron was added.

Active Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.
