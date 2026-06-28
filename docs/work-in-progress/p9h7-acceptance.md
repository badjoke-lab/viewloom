# TEMPORARY — P9H7 hosted and production acceptance

Status: active
Created: 2026-06-28
Roadmap phase: Phase 9 — History P1 repair
Implementation branch: `work-history-ui-h7-acceptance`
Preview branch: `preview-history-ui-h7-acceptance`
Production branch: `main`

## Entry condition

```text
P9H6 implementation complete PR #449
P9H6 canonical closeout complete PR #450
Starting main SHA a2d641958c0068b818218d9e6080b2b3b5ee9e72
Explicit continuation received 2026-06-28
```

## Scope

P9H7 adds permanent hosted-acceptance tooling and executes the accepted P9H6 candidate against real Cloudflare Preview and production data.

It must prove:

- exact deployment identity through `/deployment.json`;
- Preview environment, branch, and exact candidate SHA;
- production environment, `main`, and exact merged SHA;
- Twitch `DB_TWITCH_HOT / vl_twitch_hot` and Kick `DB_KICK_HOT / vl_kick_hot` separation;
- real retained data for Viewer-minutes and Peak viewers;
- 1440px, 820px, 390px, and 360px public History behavior;
- task and archive direct links, Back/Forward, metric execution, and no-refetch task switching;
- chart scale, date context, keyboard and touch inspection;
- publishing context, bounded-scope language, touch targets, focus, overflow, reduced motion, and forced colors.

## Files

```text
apps/web/scripts/history-ui-h7-hosted-acceptance.mjs
scripts/verify-history-ui-h7-evidence.mjs
scripts/verify-history-ui-h7-acceptance.mjs
.github/workflows/history-ui-h7-acceptance.yml
```

## Preview sequencing exception

The connector created `preview-history-ui-h7-acceptance` once at the starting `main` SHA before the P9H7 files reached their final candidate HEAD. That preliminary ref and any deployment produced from it are superseded and are not acceptance evidence.

Compensating controls:

- only the exact final work-branch HEAD may be moved to the Preview ref;
- `/deployment.json` must match the final SHA, Preview environment, and exact Preview branch;
- only the latest Preview workflow artifact counts;
- the PR must disclose the preliminary ref creation;
- no product runtime or data contract changed in the preliminary ref.

## Preview trigger record

```text
Implementation PR: #451
Preview trigger PR: #452 — never merge
PR #452 moved Draft -> Ready: 2026-06-28
First exact-head attempt SHA: ea72ee27ed7d3b43763370240d05cf9e328910ac
First tracked Preview workflow: 28317314450
First artifact: history-ui-h7-preview-acceptance / 7933140146
First result: fail before browser/API acceptance
Failure: branch Preview origin returned 404 for all 60 deployment identity probes
```

PR #452 exists only to activate Cloudflare Pages Preview deployment for the `preview-*` branch. It was moved to Ready because the Draft state did not produce the required branch deployment. The failed 404 attempt is retained as operational evidence but is not product failure and cannot count as acceptance. This documentation commit creates a new exact candidate SHA while the trigger PR is Ready; both the work and Preview refs must move to that same SHA before the next attempt.

## Completion sequence

```text
1. Complete repository tooling and canonical active-state updates.
2. Pass PR repository, typecheck, build, and retained regression gates.
3. Move the Preview ref to the exact final work HEAD.
4. Pass hosted Preview acceptance with real Twitch and Kick data.
5. Squash merge the accepted work branch to main.
6. Pass automatic production acceptance for the exact merge SHA.
7. Transfer evidence to a permanent production record.
8. Delete this note and history-ui-repair-working-note.md.
9. Mark Phase 9 complete and Phase 10 exact next.
```

## Non-goals

No History UI feature, API, D1 schema, collector, cron, retention, binding, primary metric, archive type, provider mixing, localization runtime, or output schema change is authorized.
