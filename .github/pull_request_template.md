## Summary

- What changed:
- Why:

## Governing documents and freshness

- Current-main SHA read:
- Current-main fetched at:
- Roadmap phase:
- Schedule window:
- Canonical gate/schema:
- Affected specification:
- Implementation plan:
- Active working note:
- Relevant audit/acceptance records:
- Entry condition:
- Stop rule:
- Exact next branch after merge:
- Documentation updated or retired:

## Scope

- Providers affected: Twitch / Kick / both / neither
- DB or binding changes: yes / no
- Collector or cron changes: yes / no
- D1 schema changes: yes / no
- Backfill changes: yes / no
- Retention changes: yes / no
- Output-schema changes: yes / no
- Cloudflare runtime changes: yes / no
- Public UI exposure changes: yes / no
- Layout/responsive/accessibility changes: yes / no
- Cross-provider behavior changes: yes / no

## Development policy

- [ ] I fetched current `main` before creating this branch and recorded the SHA above.
- [ ] I read `AGENTS.md` and `docs/README.md`.
- [ ] I read the current roadmap, schedule, canonical gate, affected specification/plan, active WIP, and development policy.
- [ ] I compared the schedule with actual branches, PRs, and production state.
- [ ] The schedule authorizes this exact branch, or this PR repairs documents before implementation.
- [ ] I reread current-main authorities before marking this PR ready.
- [ ] No newer source-of-truth change supersedes this candidate.
- [ ] Ordinary work used a `work-*` branch.
- [ ] Related changes are grouped logically; connector-forced commits will be squash merged.
- [ ] Unnecessary Cloudflare Preview was not requested.
- [ ] Targeted checks were used during iteration.
- [ ] Complete required checks ran on the latest candidate HEAD.
- [ ] Superseded CI was not treated as authoritative.
- [ ] Twitch and Kick remain separated.
- [ ] Missing/partial/stale/empty/error/demo/unknown/unavailable states remain honest.
- [ ] No later phase began before its entry condition.
- [ ] The active working note and current schedule remain accurate.

## Verification

Targeted checks:

```text

```

Final candidate checks:

```text

```

Screenshot/artifact review:

```text

```

Preview validation:

- Required: yes / no
- Preview branch or URL:
- Result:

## Release and documentation state

- [ ] PR is ready to merge.
- [ ] Production deployment is still pending after merge.
- [ ] Production deployment was verified separately.
- [ ] Production smoke checks passed.
- [ ] Required manual visual/accessibility acceptance passed.
- [ ] Permanent specifications describe final behavior.
- [ ] Roadmap, schedule, gate, active WIP, and affected plan are current.
- [ ] Completed temporary notes/workflows/triggers were retired when required.
- [ ] The exact next branch and stop rule are recorded.

Do not mark production or public acceptance before deployment and required checks pass.

## Exceptions

Document any policy/governance exception, reason, risk, compensating verification, temporary status, and follow-up. Write `None` when there is no exception.
