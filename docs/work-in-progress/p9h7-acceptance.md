# TEMPORARY — P9H7 hosted and production acceptance

Status: active
Created: 2026-06-28
Roadmap phase: Phase 9 — History P1 repair
Implementation branch: `work-history-ui-h7-acceptance`
Attempted Preview branch: `preview-history-ui-h7-acceptance`
Preview branch: `preview-history-ui-h7-acceptance`
Production branch: `main`

## Entry condition

```text
P9H6 implementation complete PR #449
P9H6 canonical closeout complete PR #450
Starting main SHA a2d641958c0068b818218d9e6080b2b3b5ee9e72
Explicit continuation received 2026-06-28
```

## Preview sequencing exception

The original control stated that only the exact final work-branch HEAD may be moved to the Preview ref. The exact branch was used, but Cloudflare never produced a deployment.

```text
Preview trigger PR: #452 — never merge
First tracked workflow: 28317314450
First artifact: history-ui-h7-preview-acceptance / 7933140146
Final exact-head workflow: 28318577620
Final exact-head SHA: 815757a3a2e79b735adca136fccafbd3bdcee2c9
Final artifact: history-ui-h7-preview-acceptance / 7933542788
Result: 404 before deployment identity, provider checks, or browser checks
```

## Controlled acceptance exception

P9H7 changes acceptance automation and governance only. The required substitute is:

1. Run the complete pre-merge production baseline against the exact current `main` SHA.
2. Require repository, typecheck, build, provider separation, real data, and five browser scenarios to pass.
3. Close PR #452 without merge.
4. Squash merge PR #451.
5. Run the same acceptance against the exact merged production SHA.
6. Transfer the failed Preview record and successful production evidence to a permanent record.

This preserves exact deployment identity on both sides of an acceptance-only merge.

## Required coverage

- Twitch `DB_TWITCH_HOT / vl_twitch_hot` and Kick `DB_KICK_HOT / vl_kick_hot` remain separate.
- Viewer-minutes and Peak viewers must use real retained data.
- 1440px, 820px, 390px, and 360px scenarios must pass.
- URL, Back/Forward, no-refetch task switching, keyboard, touch, focus, overflow, reduced motion, and forced colors must pass.

## Completion sequence

```text
pre-merge production baseline
close PR #452 without merge
squash merge PR #451
exact-merge-SHA production acceptance
permanent evidence transfer
delete temporary History notes
mark Phase 9 complete
```

## Non-goals

No History UI feature, API, D1 schema, collector, cron, retention, binding, primary metric, archive type, provider mixing, localization runtime, Watchlist behavior, or output schema change is authorized.
