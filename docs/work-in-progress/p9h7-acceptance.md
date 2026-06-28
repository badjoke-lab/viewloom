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
