# 12A-4-21 Twitch permanent category release package candidate

## Status

PR #627 prepares the dormant Twitch-only release package. Production release from PR #627: no. Exact one-file trigger present: no. Twitch permanent runtime capture remains inactive, and Kick remains unauthorized and unchanged.

## Accepted implementation input

- Implementation PR: #625.
- Implementation merge: `66f2b544e22dafc52e76d684cc2844c734eb8c09`.
- Package acceptance PR: #626.
- Acceptance merge: `3bf0b407d27eac9de1f8b2480a223d244f3f1a30`.
- Canonical input gate: v24 / phase 12A-4-20.
- Permanent Twitch config: `workers/collector-twitch/wrangler.category-permanent.toml`.
- Normal rollback config: `workers/collector-twitch/wrangler.toml`.

## Dormant release package

PR #627 adds:

- an exact trigger contract and inspector;
- an exact start-boundary wait with a three-hour maximum;
- a release runner that executes the accepted read-only preflight before any production change;
- main-only release execution after a separate exact one-file trigger;
- post-release polling that requires two category-bearing real non-empty snapshots;
- automatic normal-config restoration when initial verification fails;
- rollback proof requiring the permanent flag absent, provider leakage zero, and a new normal payload after restoration;
- sanitized JSON evidence upload;
- exact package and trigger scope verification.

## Pull request boundary

- Production release from PR #627: no.
- Cloudflare credentials used by PR validation: no.
- Remote D1 operation from PR validation: no.
- Exact one-file trigger present: no.
- Production Twitch config changed by PR #627: no.
- Kick change: no.
- Five-minute Worker cron change: no.
- New Worker cron: no.
- Backfill or retention expansion: no.
- Category UI or cross-provider behavior: no.

## Production order after later trigger

1. Verify the exact trigger and accepted PR/merge identities.
2. Reach the exact start boundary.
3. Run the fresh Cloudflare GET / D1 SELECT preflight.
4. Stop before release on any failed storage, schema, identity, binding, leakage, freshness, real/non-empty snapshot, or provider-separation gate.
5. Release only the accepted Twitch permanent-category configuration.
6. Verify the permanent flag and absence of obsolete canary bindings.
7. Verify two consecutive real, non-empty, category-bearing snapshots.
8. Restore the normal Twitch config automatically if initial verification fails.
9. Freeze sanitized start or rollback evidence.
10. Begin the separate 24–48 hour observation phase only after a successful start.

## Next gate

Accept PR #627 without creating the trigger. Then advance the canonical gate and create a separate exact one-file trigger with a start boundary inside the three-hour runner limit.

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
- `docs/audits/12a4-twitch-permanent-category-release-contract.json`
- `docs/operations/development-and-deployment-policy.md`

## Current authorization

Twitch implementation accepted: yes.  
Twitch release package candidate: yes.  
Twitch runtime active: no.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
