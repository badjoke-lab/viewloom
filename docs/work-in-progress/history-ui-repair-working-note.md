# TEMPORARY — ViewLoom History UI repair working note

Status: active
Last updated: 2026-06-26
Completed P9H0: PR #430
Completed documentation closeout: PR #432
Current implementation branch: none
Exact next branch: `work-history-ui-h1-metric`

## P9H0 findings

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local keyboard run reached the ViewLoom home link. The P8B production body-focus result remains a P9H5 and final-acceptance discrepancy.

## P9H1 scope

P9H1 updates Viewer-minutes and Peak viewers across URL, request, control, chart, Summary, Selected day, comparison, Ranking context, supported Archives, Report, Share, and Exports.

It preserves Twitch/Kick separation, request reuse, Back/Forward, degraded states, and output schemas. It adds no new fetch wrapper or document-wide observer.

P9H1 has not been created. Work resumes only after explicit continuation.