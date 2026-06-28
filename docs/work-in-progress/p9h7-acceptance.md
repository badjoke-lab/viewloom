# TEMPORARY — P9H7 hosted and production acceptance

Status: active
Created: 2026-06-28
Last updated: 2026-06-28
Roadmap phase: Phase 9 — History P1 repair
Implementation branch: `work-history-ui-h7-acceptance`
Attempted Preview branch: `preview-history-ui-h7-acceptance`
Production branch: `main`

## Entry condition

```text
P9H6 implementation complete PR #449
P9H6 canonical closeout complete PR #450
Starting main SHA a2d641958c0068b818218d9e6080b2b3b5ee9e72
Explicit continuation received 2026-06-28
```

## Scope

P9H7 adds permanent hosted-acceptance tooling for the accepted P9H6 History candidate. It does not change the History product runtime.

It must prove:

- exact deployment identity through `/deployment.json`;
- production environment, `main`, and exact commit SHA before and after merge;
- Twitch `DB_TWITCH_HOT / vl_twitch_hot` and Kick `DB_KICK_HOT / vl_kick_hot` separation;
- real retained data for Viewer-minutes and Peak viewers;
- 1440px, 820px, 390px, and 360px public History behavior;
- task and archive direct links, Back/Forward, metric execution, and no-refetch task switching;
- chart scale, date context, keyboard and touch inspection;
- publishing context, bounded-scope language, touch targets, focus, overflow, reduced motion, and forced colors.

## Files

```text
apps/web/scripts/history-ui-h7-hosted-acceptance.mjs
apps/web/scripts/history-ui-h7-preview-trigger.json
scripts/verify-history-ui-h7-evidence.mjs
scripts/verify-history-ui-h7-acceptance.mjs
.github/workflows/history-ui-h7-acceptance.yml
```

## Preview attempt record

```text
Implementation PR: #451
Preview trigger PR: #452 — never merge
Attempted branch: preview-history-ui-h7-acceptance
Attempted origin: https://preview-history-ui-h7-acceptance.viewloom.pages.dev
First tracked workflow: 28317314450
First artifact: history-ui-h7-preview-acceptance / 7933140146
Final exact-head workflow: 28318577620
Final exact-head SHA: 815757a3a2e79b735adca136fccafbd3bdcee2c9
Final artifact: history-ui-h7-preview-acceptance / 7933542788
Result: fail before provider or browser acceptance
Failure: Preview origin returned 404 for all deployment identity probes
```

The failure occurred before any History API or browser scenario ran. It is therefore an external Preview-deployment availability failure, not a History product failure. The repository policy's Cloudflare dashboard verification record is still pending, so repository content alone cannot prove the Preview include rule or build-watch state.

## Controlled acceptance exception

P9H7 changes acceptance automation and governance only. The deployed History runtime at the PR base is the same P9H6 runtime that will be deployed after this PR, apart from acceptance-only files that are not imported by the product.

The required substitute sequence is therefore:

1. On the PR, run the complete hosted acceptance against `https://vl.badjoke-lab.com` and require `/deployment.json` to match the exact current `main` base SHA.
2. Require all repository, typecheck, build, retained regression, real provider, and five public browser scenarios to pass.
3. Close PR #452 without merge. Its only purpose was to request a Preview deployment.
4. Squash merge PR #451 to `main` only after the pre-merge production baseline passes.
5. Require the automatic post-merge production acceptance to match the exact squash-merge SHA and pass the same provider and browser matrix.
6. Transfer both the failed Preview operational record and the successful production evidence to a permanent acceptance record.

This exception does not weaken exact deployment identity. It replaces an unavailable non-production host with two exact-SHA production gates around an acceptance-only merge.

## Completion sequence

```text
1. Complete repository tooling and canonical exception updates.
2. Pass PR repository, typecheck, build, and retained regression gates.
3. Pass the exact-base-SHA pre-merge production baseline.
4. Close Preview trigger PR #452 without merge.
5. Squash merge PR #451 to main.
6. Pass automatic production acceptance for the exact merge SHA.
7. Transfer evidence to a permanent production record.
8. Delete this note and history-ui-repair-working-note.md.
9. Mark Phase 9 complete and Phase 10 exact next.
```

## Non-goals

No History UI feature, API, D1 schema, collector, cron, retention, binding, primary metric, archive type, provider mixing, localization runtime, Watchlist behavior, or output schema change is authorized.
