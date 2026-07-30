# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-31

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture remain active on five-minute collectors.
- Checkpoint run `30478338654` failed: 151/154 slots, three consecutive missing buckets, and category-reference coverage `0.994524`.
- Diagnosis attempt 1 was cancelled before the runner; attempt 2 succeeded as run/job/artifact `30541697022` / `90942773349` / `8767937513`.
- Diagnosis evidence was frozen and the trigger, execution workflow, and reporter were retired in PR #680.
- The diagnosis decision concludes that the original replacement window is invalid and recovery is required before a new stability clock may start.

### Current gate: Twitch category-source completeness v2 recovery package

Current branch after decision:

`work-659-twitch-category-source-v2-completeness-recovery-package`

## Accepted decision

- The `07:20`, `07:25`, and `07:30` UTC rows are permanently absent; the observed maximum consecutive gap is 3 while the accepted maximum is 2.
- Checkpoint coverage was `0.994524`; post-checkpoint coverage was `0.994236`, still below `0.995` and slightly worse.
- Stored v1 rows cannot distinguish empty Twitch `game_id` from empty `game_name`.
- The original start `2026-07-29T05:30:00.000Z` and earliest audit `2026-08-05T05:30:00.000Z` are retired.
- No backfill, threshold relaxation, synthetic category mapping, or automatic clock reset is authorized.

## Active deliverable

Create a dormant Twitch-only `category-source-v2-candidate` recovery package that:

- preserves exact per-item source completeness before source fields are stripped;
- distinguishes `both_present`, `both_empty`, `provider_id_only`, and `category_name_only`;
- emits compact per-snapshot counts and per-item state encoding;
- measures partial pairs, both-empty observations, valid refs, provider leakage, storage, and execution cost;
- changes no Kick behavior and exposes no public UI;
- performs no production execution on the package PR.

A later separately accepted execution package must activate the candidate only for Twitch, freeze two consecutive real/nonempty/fresh snapshots, and observe the source-state distribution. A separate semantic/clock decision then fixes the new stability start.

## Following gates

1. dormant v2 recovery package;
2. separate package acceptance and Twitch-only execution;
3. consecutive post-activation snapshot evidence;
4. separate semantic and new-clock decision;
5. seven stable days from the accepted new start;
6. final audit and later separate public cutover.

## Hard boundaries

- No checkpoint rerun, historical row recreation, threshold relaxation, or automatic clock reset.
- No synthetic category mapping without a later separate acceptance.
- No Worker deployment, D1 mutation, binding/cadence/retention/Kick change, final mode, cross-provider behavior, or public category UI in the package PR.
- Existing unfiltered Heatmap remains the fallback.

## Source of truth

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json`;
- current schedule and audit specification;
- canonical v33 runtime gate;
- frozen checkpoint and diagnosis evidence/retirement;
- active WIP and development policy.
