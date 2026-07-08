# ViewLoom cross-site quality remediation plan

Status: post-merge hosted closeout pending
Version: 2.8
Last updated: 2026-07-08
Permanent specification: `cross-site-quality-remediation-spec.md`
Completed implementation branch: `work-quality-phase11-acceptance-operations`
Completed phase through candidate merge: Phase 11 acceptance and operations PR #473
Current workstream: Phase 11 hosted production monitoring closeout and canonical synchronization

Twitch and Kick remain separate. Phase 11 is a quality, type-safety, CI, monitoring, runbook, and maintenance program. It does not authorize new APIs, storage, bindings, collectors, retention changes, localization runtime, or provider combination.

```text
P11A strict-null migration complete
P11B CI ownership and duplication decision complete
P11C monitoring contract complete; hosted closeout required after merge
P11D failure runbook and escalation ownership complete
P11E maintenance cadence complete
P11F all-public acceptance ownership complete
P11G final pre-merge acceptance complete
P11G candidate merged PR #473
Hosted production monitoring closeout pending
```

P11B decision: seven initial latest-head cancellation gaps were repaired and the current latest-head gap count is zero. Thirty-six current repeated named steps were classified. Named-step overlap alone retired zero workflows; future retirement requires named replacement assertions and passing evidence.

P11C–P11E use existing Status APIs and GitHub Actions. No new application cron or collector cron was added.

Current Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.

After hosted closeout and canonical synchronization, the next approved program sequence is governed by `current-roadmap.md`, `current-schedule.md`, and `post-watchlist-program-plan.md`. Analytics work is separately governed by `analytics-observation-system-spec.md` and `analytics-observation-system-plan.md`.
