# ViewLoom History UI repair implementation plan

Status: complete
Version: 2.8
Last updated: 2026-06-29
Roadmap phase: Phase 9 — History P1 repair complete
Completed P9H0: PR #430
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Completed P9H3: PR #439
Completed P9H3 canonical closeout: PR #440
Completed P9H4A: PR #441
Completed P9H4A canonical closeout: PR #442
Completed P9H4B: PR #443
Completed P9H4B canonical closeout: PR #444
Completed P9H5: PR #447
Completed P9H5 canonical closeout: PR #448
Completed P9H6: PR #449
Completed P9H6 canonical closeout: PR #450
Completed P9H7 production acceptance: PR #451
Completed P9H7 canonical closeout: PR #453
Active implementation branch: none
Exact next branch after explicit continuation: `work-quality-u10a-baseline`

## Final outcome

Phase 9 repaired and accepted the public Twitch and Kick History experience without changing APIs, D1 schemas, collectors, cron, retention, bindings, provider separation, primary metrics, or output schemas.

Permanent acceptance evidence:

```text
Record: docs/operations/history-production-acceptance-2026-06-28.md
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge workflow/artifact: 28325492470 / 7935573120
Post-merge workflow/artifact: 28325951638 / 7935706617
Providers: Twitch and Kick, separated
Hosted scenarios: 1440 / 820 / 390 / 360 / forced colors
Result: pass
```

The temporary History repair notes are removed at canonical closeout. The permanent P9H6 candidate tooling and P9H7 hosted-acceptance tooling remain as regression protection.

## Completed phase sequence

```text
P9H0  work-p9h0-baseline                       complete PR #430
P9H1  work-history-ui-h1-metric                complete PR #434
P9H2  work-history-ui-h2-chart                 complete PR #436
P9H3  work-history-ui-h3-overview              complete PR #439
P9H4A work-history-ui-h4a-overview-balance     complete PR #441
P9H4B work-history-ui-h4b-tasks                complete PR #443
P9H5  work-history-ui-h5-responsive            complete PR #447
P9H6  work-history-ui-h6-candidate             complete PR #449
P9H7  work-history-ui-h7-acceptance            complete PR #451
Closeout work-history-ui-h7-closeout           complete PR #453
```

## Historical gate strings

The following strings are retained only for earlier phase-specific verifiers. They are not current state.

```text
Version: 2.7
Current implementation branch: `work-history-ui-h7-acceptance`
Current Preview branch: `preview-history-ui-h7-acceptance`
Active P9H7 — Hosted and production acceptance
Version: 2.6
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h7-acceptance`
P9H7  work-history-ui-h7-acceptance        exact next after explicit continuation; not created
Version: 2.5
Completed P9H5: PR #447
Completed P9H5 canonical closeout: PR #448
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h6-candidate`
P9H6  work-history-ui-h6-candidate         exact next after explicit continuation; not created
P9H6 active
Current implementation branch: `work-history-ui-h6-candidate`
P9H6 canonical closeout active
Current implementation branch: `work-history-ui-h6-closeout`
Version: 2.4
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h5-responsive`
P9H5 work-history-ui-h5-responsive        exact next after explicit continuation; not created
P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`
Version: 2.3
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4b-tasks`
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created
P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`
Version: 2.2
Current implementation branch: `work-history-ui-h4a-overview-balance`
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H4A canonical closeout active
Current implementation branch: `work-history-ui-h4a-closeout`
Version: 2.1
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created
Version: 2.0
Current implementation branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview   active
Version: 1.9
Current implementation branch: none
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created
Version: 1.8
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`
P9H2 work-history-ui-h2-chart      active
Version: 1.7
Completed P9H1: PR #434
Current implementation branch: none
P9H2 work-history-ui-h2-chart      exact next; not created
```

## Permanent regression tooling

```text
apps/web/scripts/history-ui-h6-candidate-manifest.mjs
scripts/verify-history-ui-h6-candidate.mjs
.github/workflows/history-ui-h6-candidate.yml
apps/web/scripts/history-ui-h7-hosted-acceptance.mjs
scripts/verify-history-ui-h7-evidence.mjs
scripts/verify-history-ui-h7-acceptance.mjs
.github/workflows/history-ui-h7-acceptance.yml
```

## Handoff

Phase 10 U10A is next only after explicit continuation. U10A must reproduce and classify non-History defects before repair, identify authoritative and legacy owners, add failing assertions or explicit baseline fixtures, and create the temporary Phase 10 working note. No later phase begins in parallel.