# 12A-4-21 Twitch permanent category release package accepted

## Status

PR #627 is merged and accepted by PR #628. The dormant Twitch-only release workflow is present, but the exact one-file trigger is absent. Twitch permanent runtime capture remains inactive, and Kick remains unauthorized and unchanged.

## Accepted release package

- Release package PR: #627.
- Release package merge: `312f2c4d54dc4f881aa35e58140bd504b1b2229c`.
- Accepted candidate HEAD: `b1250cfd16996556eb99582dbd10599d667fb730`.
- Validation run: `29723684031`.
- Validation job: `88291928546`.
- Acceptance PR: #628.
- Acceptance evidence: `docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json`.
- Canonical gate: v25 / phase 12A-4-21.

The accepted package provides exact-trigger validation, a bounded start wait, fresh read-only preflight ordering, initial two-snapshot verification, automatic normal-config restoration on failed start verification, rollback recovery proof, and sanitized evidence collection.

## Current production state

- Twitch permanent category capture active: no.
- Permanent production flag present: no.
- Exact one-file release trigger present: no.
- Normal Twitch five-minute collection continues.
- Kick change: no.
- Remote D1 mutation by PR #627 or #628: no.

## Current action

Create one exact trigger file that pins:

- implementation PR #625 and merge `66f2b544e22dafc52e76d684cc2844c734eb8c09`;
- implementation acceptance PR #626 and merge `3bf0b407d27eac9de1f8b2480a223d244f3f1a30`;
- release package PR #627 and merge `312f2c4d54dc4f881aa35e58140bd504b1b2229c`;
- confirmation `RUN_TWITCH_PERMANENT_CATEGORY_RELEASE`;
- a start boundary inside the three-hour runner limit.

The trigger PR must change exactly one file. Its pull-request jobs validate only. The main-branch trigger push starts the accepted release workflow.

## Main workflow order

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

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
- `docs/audits/12a4-twitch-permanent-category-release-contract.json`
- `docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`

## Current authorization

Twitch implementation accepted: yes.  
Twitch release package accepted: yes.  
Exact release trigger present: no.  
Twitch runtime active: no.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker schedule authorized: no.  
Cross-provider identity or ranking authorized: no.
