# 12A-3 post-merge accumulation acceptance

Date: 2026-07-12
Status: accepted

```text
PR: #511
Candidate head: 614b61a0ac98aaa6954a9a6c157163c6539da5ff
Acceptance workflow: 29191430966
Main deploy workflow: 29191094150
Merge SHA: ad90585d74149b0fb1805b9a76fd8d796a5e7c2d
```

## Provider results

### Twitch

```text
days: 2026-07-11, 2026-07-12
rows: 600, 600
source snapshots: 288, 148
refreshed_at: 2026-07-12T12:20:15.305Z, 2026-07-12T12:20:14.385Z
provider gate: true
```

### Kick

```text
days: 2026-07-11, 2026-07-12
rows: 200, 200
source snapshots: 288, 148
refreshed_at: 2026-07-12T12:20:14.750Z, 2026-07-12T12:20:14.076Z
provider gate: true
```

## Gate

```text
deploymentPass: true
postMergeAccumulationPass: true
temporaryVerifiersRetained: false
manualCollectorRouteUsed: false
temporaryGeneratorUsed: false
backfillPerformed: false
newCronAdded: false
```

The enabled production collectors refreshed today and yesterday through the existing scheduled maintenance window. 12A-3 may proceed to canonical closeout.
