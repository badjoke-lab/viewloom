# Phase 12A-4 controlled category schema apply

Status: current design gate; no production execution in this PR  
Tracking issue: #519  
Accepted preflight PR: #523  
Accepted preflight evidence: `docs/audits/12a4-category-readonly-preflight-evidence.json`

## Purpose

Prepare the exact implementation and safety package for applying `db/d1/005_category_capture.sql` to the Twitch and Kick production D1 databases while category runtime capture remains disabled.

## This PR adds

```text
provider-shared controlled schema module
provider-separated temporary apply Worker candidate
Twitch and Kick Wrangler dry-run configs
migration parity verification
local absent -> complete -> second-pass no-op fixture
partial-schema stop fixture
zero category-row fixture
collector-state preservation fixture
scope and safety verification
```

## Production boundary

```text
production temporary Worker deployment: no
remote D1 schema apply: no
CATEGORY_CAPTURE_ENABLED: absent
production category rows: no
new cron: no
backfill: no
retention change: no
category analytics UI: no
cross-provider category identity: no
combined-provider category ranking: no
```

## Planned one-time production order after design acceptance

```text
1. verify exact main SHA and accepted read-only evidence
2. confirm committed collector configs contain no category capture flag
3. deploy temporary Twitch schema Worker
4. inspect Twitch pre-state; require completely absent
5. apply Twitch schema once
6. repeat apply; require already-complete no-op
7. inspect Twitch post-state and collector latency
8. delete Twitch temporary Worker; require HTTP 404
9. stop on any Twitch failure
10. repeat the same sequence for Kick
11. freeze sanitized evidence
12. make a separate runtime capture decision
```

## Failure policy

Applied schema is not dropped during incident response. Runtime remains disabled, no backfill is performed, no probe rows are written, and a partial provider completion requires a separate recovery decision.

## Completion condition

This design gate completes when migration parity, local idempotency, partial-schema stop behavior, provider separation, Worker dry-runs, scope checks, and Development policy all pass. Completion authorizes only a separate one-time schema-apply trigger PR; it does not authorize category runtime capture.
