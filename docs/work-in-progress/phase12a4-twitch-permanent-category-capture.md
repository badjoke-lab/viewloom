# 12A-4-20 Twitch permanent category capture package accepted

## Status

PR #625 is merged and its Twitch-only permanent category capture package is accepted by PR #626. Twitch permanent runtime capture is still inactive. Kick remains unauthorized and unchanged.

## Accepted package

- Package PR: #625.
- Package merge: `66f2b544e22dafc52e76d684cc2844c734eb8c09`.
- Accepted candidate HEAD: `e975d1b886736efac8d7d6ca8872f533fb249aed`.
- Validation run: `29721764872`.
- Validation job: `88286067503`.
- Diagnostics artifact: `8452621374`.
- Artifact digest: `sha256:08f2ad41f4b0a72835060553d23aa685bcdd101e8e503a4bd3c1f91e200411fa`.
- Acceptance evidence: `docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json`.

The accepted package includes the explicit Twitch permanent-category configuration, category-disabled rollback configuration, read-only preflight/observation probe, exact scope gate, fixtures, contract verifier, collector typecheck, and normal/permanent dry-run Worker bundles.

## Current production state

- Twitch permanent category capture active: no.
- Permanent production flag present: no.
- Exact release trigger present: no.
- Normal Twitch five-minute collection continues.
- Kick change: no.
- Remote D1 mutation by PR #625 or #626: no.

## Next gate

Prepare Phase 12A-4-21 as a separate exact Twitch production release package. It must:

1. pin the accepted package and acceptance identities;
2. run a fresh read-only production preflight;
3. stop before activation on any failed storage, schema, identity, binding, leakage, freshness, real/non-empty snapshot, or provider-separation gate;
4. activate only the accepted Twitch permanent-category configuration;
5. verify the permanent flag and absence of obsolete canary bindings;
6. verify two consecutive real, non-empty, category-bearing snapshots;
7. retain immediate restoration of the normal Twitch configuration;
8. start the minimum 24-hour observation without changing Kick.

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
- `docs/operations/development-and-deployment-policy.md`

## Hard boundaries

Twitch package accepted: yes.  
Twitch runtime active: no.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
