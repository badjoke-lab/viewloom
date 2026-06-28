# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.7
Last updated: 2026-06-28
Roadmap phase: Phase 9 — History P1 repair
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
Current implementation branch: `work-history-ui-h7-acceptance`
Current Preview branch: `preview-history-ui-h7-acceptance`

## Historical gate strings

```text
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

## Completed P9H6 — Local candidate

PR #449 built the accepted History implementation once and executed P9H1–P9H5 against one local preview and one exact candidate HEAD.

```text
Final head: c7d54e530053b29091b84e651b78b679f55f3a8a
Merge: d46e2f3d04c9528e6493d9aa3d436000e340272a
Workflow: 28308389704
Artifact: history-ui-h6-candidate / 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Manifest: viewloom-history-ui-h6-candidate-v1
Accepted phases: 6
Accepted scenarios: 21
```

Permanent candidate files:

```text
apps/web/scripts/history-ui-h6-candidate-manifest.mjs
scripts/verify-history-ui-h6-candidate.mjs
.github/workflows/history-ui-h6-candidate.yml
```

P9H2 and P9H3 evidence record the exact candidate HEAD and stable scenario IDs. Provider separation, direct links, Back/Forward, metric execution, no-refetch task/archive switching, publishing context, required widths, keyboard, touch, focus, reduced motion, forced colors, and all output schemas remain protected.

## Active P9H7 — Hosted and production acceptance

P9H7 does not change the product. It verifies the accepted implementation against real Cloudflare bindings and retained data.

```text
work branch:    work-history-ui-h7-acceptance
Preview branch: preview-history-ui-h7-acceptance
Preview origin: https://preview-history-ui-h7-acceptance.viewloom.pages.dev
Production:     https://vl.badjoke-lab.com
```

Acceptance requires:

- exact `/deployment.json` environment, branch, and commit SHA;
- real Viewer-minutes and Peak viewers responses for Twitch and Kick;
- correct provider bindings and databases;
- 1440, 820, 390, and 360 pixel public browser scenarios;
- task/archive/report direct links and Back/Forward;
- one request per uncached metric and no-refetch task switching;
- keyboard and touch chart inspection;
- provider-safe publishing context and limitation language;
- no overflow, minimum targets, focus, reduced motion, and forced colors;
- permanent evidence transfer and deletion of temporary History repair notes.

Permanent acceptance tooling under construction:

```text
apps/web/scripts/history-ui-h7-hosted-acceptance.mjs
scripts/verify-history-ui-h7-evidence.mjs
scripts/verify-history-ui-h7-acceptance.mjs
.github/workflows/history-ui-h7-acceptance.yml
```

```text
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        complete PR #447
P9H6  work-history-ui-h6-candidate         complete PR #449
P9H7  work-history-ui-h7-acceptance        active
```
