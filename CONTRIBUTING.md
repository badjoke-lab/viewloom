# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, specifications, implementation plans, and permanent evidence before changing the repository.

## Current state

```text
Phase 10 U10A quality baseline complete through PR #454
Phase 10 U10B shared shell complete through PR #456
Phase 10 U10C visualization complete through PR #458
Phase 10 U10D analysis coherence complete through PR #462
U10D canonical closeout complete through PR #464
Phase 10 U10E responsive and accessibility complete through PR #465
U10E canonical closeout complete through PR #466
Phase 10 U10F readiness complete through PR #468
U10F canonical closeout complete through PR #469
Phase 10 U10G architecture complete through PR #470
Phase 10 U10H production acceptance active
Active implementation branch: work-quality-u10h-acceptance
Exact next implementation branch: work-quality-phase11-acceptance-operations
U10H branch created: yes
```

Active U10H record: `docs/work-in-progress/u10h-acceptance.md`.
Permanent U10G evidence: PR #470 Quality U10G Architecture artifact `8076053343`.
Permanent U10F record: `docs/audits/cross-site-quality-u10f-readiness.json`.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and entry check
  -> implementation
  -> targeted checks
  -> browser evidence
  -> merge
  -> canonical closeout
  -> full report and stop
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain separate.
