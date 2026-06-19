## Summary

- What changed:
- Why:

## Scope

- Providers affected: Twitch / Kick / both / neither
- DB or binding changes: yes / no
- Collector or cron changes: yes / no
- Retention changes: yes / no
- Cloudflare runtime changes: yes / no

## Development policy

- [ ] I read `docs/operations/development-and-deployment-policy.md`.
- [ ] Ordinary implementation was performed on a `work-*` branch.
- [ ] Related file changes were grouped logically; one-file-per-commit was not used as the normal workflow.
- [ ] Unnecessary Cloudflare Preview deployments were not requested.
- [ ] Targeted checks were used during iteration.
- [ ] Full required checks were run on the latest completed candidate HEAD.
- [ ] Superseded CI results were not treated as authoritative.
- [ ] Twitch and Kick storage, rankings, totals, and coverage claims remain separated.

## Verification

Targeted checks:

```text

```

Final candidate checks:

```text

```

Preview validation:

- Required: yes / no
- Preview branch or URL:
- Result:

## Release state

- [ ] PR is ready to merge.
- [ ] Production deployment is still pending after merge.
- [ ] Production deployment was verified separately.
- [ ] Production smoke checks passed.

Do not mark the last two boxes before the production deployment actually completes and the public checks pass.

## Exceptions

Document any policy exception, reason, risk, compensating verification, and follow-up. Write `None` when there is no exception.
