# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
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
P9H7 active
Current implementation branch: `work-history-ui-h7-acceptance`
Current Preview branch: `preview-history-ui-h7-acceptance`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## Historical gate strings

```text
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h7-acceptance`
P9H6 active
Current implementation branch: `work-history-ui-h6-candidate`
P9H6 canonical closeout active
Current implementation branch: `work-history-ui-h6-closeout`
P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`
P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`
Current implementation branch: `work-history-ui-h4a-overview-balance`
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H4A canonical closeout active
Current implementation branch: `work-history-ui-h4a-closeout`
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`
P9H4 work-history-ui-h4-tasks            exact next after explicit continuation; not created
Current implementation branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview         active
P9H4 work-history-ui-h4-tasks            exact next after P9H3 merge and explicit continuation; not created
P9H3 work-history-ui-h3-overview         exact next after explicit continuation; not created
Current implementation branch: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart            active
P9H2 work-history-ui-h2-chart            exact next after explicit continuation; not created
```

## Retained evidence

```text
Workflow run: 28232602651
Artifact ID: 7903212809
Workflow run: 28278497196
Artifact ID: 7921020539
Workflow run: 28280486736
Artifact ID: 7921680615
Workflow run: 28283570437
Artifact ID: 7922730563
Workflow run: 28289223184
Artifact ID: 7924451682
Workflow run: 28293856405
Artifact ID: 7925847144
```

Historical P9H2 implementation owners retained for permanent acceptance:

```text
history-chart-p9h2.ts               SVG semantics, roving day navigation, exact inspection
history-usability.ts                API coverageState preservation, including in-progress
history-ui-h2-chart-browser.mjs     Twitch desktop and Kick touch-mobile acceptance
```

## P9H6 completion

```text
Final head: c7d54e530053b29091b84e651b78b679f55f3a8a
Merge commit: d46e2f3d04c9528e6493d9aa3d436000e340272a
Workflow run: 28308389704
Artifact: history-ui-h6-candidate
Artifact ID: 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Manifest: viewloom-history-ui-h6-candidate-v1
Accepted phases: 6
Accepted scenarios: 21
```

## P9H7 active acceptance

```text
Starting main SHA: a2d641958c0068b818218d9e6080b2b3b5ee9e72
Work branch: work-history-ui-h7-acceptance
Preview branch: preview-history-ui-h7-acceptance
Preview origin: https://preview-history-ui-h7-acceptance.viewloom.pages.dev
Production origin: https://vl.badjoke-lab.com
Evidence schema: viewloom-history-ui-h7-hosted-acceptance-v1
Required scenarios: 5
Required widths: 1440 / 820 / 390 / 360
```

The preliminary Preview ref created at the starting main SHA is superseded and cannot count. Only a deployment whose `/deployment.json` matches the exact final work HEAD is eligible for Preview acceptance.

P9H7 is acceptance-only. No API, D1, collector, cron, retention, binding, primary metric, archive, provider, or output schema change is authorized.
