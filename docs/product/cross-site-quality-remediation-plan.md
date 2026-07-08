# ViewLoom cross-site quality remediation plan

Status: complete
Version: 2.9
Last updated: 2026-07-08
Permanent specification: `cross-site-quality-remediation-spec.md`
Completed implementation branch: `work-quality-phase11-acceptance-operations`
Completed Phase 11 candidate: PR #473
Permanent production closeout: `../operations/phase11-production-closeout-2026-07-08.md`
Next active program: Phase 12 English release readiness

Twitch and Kick remain separate. Phase 10–11 completed the quality, type-safety, CI, monitoring, runbook, maintenance, and production-closeout program without authorizing provider combination.

```text
P11A strict-null migration complete
P11B CI ownership and duplication decision complete
P11C monitoring contract complete
P11D failure runbook and escalation ownership complete
P11E maintenance cadence complete
P11F all-public acceptance ownership complete
P11G final pre-merge acceptance complete
P11G candidate merged PR #473
Hosted production monitoring closeout complete
```

Hosted closeout evidence:

```text
Workflow run: 28932232525
Artifact id: 8163904094
Artifact digest: sha256:29469a860baa8da27d9155fd5fd79a162fa39467e58bc5ee2b2b4c143f8349be
Expected/deployed SHA: 90fb2714137cc83e6f20e44415574a5e35a98439
Result: pass
Blocking monitoring alerts: 0
```

P11B decision remains permanent: seven initial latest-head cancellation gaps were repaired and the recorded latest-head gap count is zero. Thirty-six repeated named steps were classified. Named-step overlap alone retired zero workflows; future retirement requires named replacement assertions and passing evidence.

P11C–P11E use existing Status APIs and GitHub Actions. No new application cron or collector cron was added.

The active sequence is now governed by `current-roadmap.md`, `current-schedule.md`, and `post-watchlist-program-plan.md`. Phase 12 is governed by `release-readiness-spec.md` and `release-readiness-plan.md`. Analytics work is separately governed by `analytics-observation-system-spec.md` and `analytics-observation-system-plan.md`.
