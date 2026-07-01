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
Active implementation branch: none
Exact next implementation branch: work-quality-u10f-readiness
U10F branch created: no
```

Permanent U10D record: `docs/audits/cross-site-quality-u10d-analysis-coherence.json`.
Permanent U10E record: `docs/audits/cross-site-quality-u10e-responsive.json`.

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
