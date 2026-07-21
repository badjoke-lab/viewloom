import fs from 'node:fs'

const read = (p) => fs.readFileSync(p, 'utf8')
const write = (p, v) => fs.writeFileSync(p, v.endsWith('\n') ? v : v + '\n')

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const evidencePath = 'docs/audits/12a4-twitch-permanent-category-final-acceptance.json'
const gate = JSON.parse(read(gatePath))
const evidence = JSON.parse(read(evidencePath))

if (gate.schemaVersion !== 'viewloom-12a2-current-gate-state-v26') {
  throw new Error(`unexpected_gate:${gate.schemaVersion}`)
}
if (evidence.status !== 'accepted') throw new Error('final_acceptance_not_accepted')

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v27'
gate.status = '12a4_twitch_permanent_category_capture_accepted'
gate.twitchPermanentCategoryFinalAcceptance = {
  status: 'accepted',
  trackingIssue: 623,
  provider: 'twitch',
  evidence: evidencePath,
  verificationPr: evidence.source.verificationPr,
  workflowRunId: evidence.source.workflowRunId,
  workflowJobId: evidence.source.workflowJobId,
  artifactId: evidence.source.artifactId,
  artifactDigest: evidence.source.artifactDigest,
  observedAt: evidence.observedAt,
  expectedCategoryRows: evidence.data.expectedCategoryRows,
  observedCategoryRows: evidence.data.observedCategoryRows,
  categoryCoverageRatio: evidence.data.categoryCoverageRatio,
  collectorErrorRunsSinceStart: evidence.data.collectorErrorRunsSinceStart,
  providerLeakageRows: evidence.data.providerLeakageRows,
  projectedNinetyDaySizeMb: evidence.storage.projectedNinetyDaySizeMb,
  projectedProviderHeadroomMb: evidence.storage.projectedProviderHeadroomMb,
  projectedAccountWideHeadroomMb: evidence.storage.projectedAccountWideHeadroomMb,
  warningExtensionRequired: false,
  rollbackRequired: false,
  kickChanged: false,
}
if (gate.categoryCapture) {
  gate.categoryCapture.runtimeCaptureStarted = true
  gate.categoryCapture.categoryCaptureFlagPresent = true
  gate.categoryCapture.twitchPermanentRuntimeCaptureActive = true
  gate.categoryCapture.twitchPermanentExactReleaseTriggerAccepted = true
  gate.categoryCapture.twitchPermanentObservationAccepted = true
}
gate.closedBlockers = Array.from(new Set([...(gate.closedBlockers ?? []),
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
]))
gate.openBlockers = (gate.openBlockers ?? []).filter((v) => ![
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
].includes(v))
gate.currentWorkstream = {
  ...(gate.currentWorkstream ?? {}),
  phase: '12A-4-23',
  name: 'Twitch permanent category capture accepted',
  trackingIssue: 623,
  productionExecutionIncluded: true,
  runtimeCaptureStarted: true,
  runtimeCaptureAuthorized: true,
  twitchPermanentCaptureAuthorized: true,
  twitchPermanentCaptureActive: true,
  twitchPermanentObservationAccepted: true,
  exactReleaseTriggerCurrent: false,
  observationScheduleCurrent: false,
  warningExtensionRequired: false,
  rollbackRequired: false,
  kickPermanentCaptureAuthorized: false,
  categoryUiAuthorized: false,
  stableAccumulationDaysBeforeUi: 7,
}
gate.nextWorkstream = '12A-4-24 separate Kick permanent category decision; keep category UI unauthorized until seven stable Twitch days are accepted'
write(gatePath, JSON.stringify(gate, null, 2))

write('docs/product/current-roadmap.md', `# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-21

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 Twitch implementation package and rollback path.
- 12A-4-21 exact Twitch release package and successful production start.
- 12A-4-22 minimum 24-hour Twitch observation with no warnings or hard stops.
- 12A-4-23 Twitch permanent category capture accepted.

### Current gate: 12A-4-23 Twitch accepted

Twitch permanent category capture remains active on the existing five-minute collector. Final evidence recorded 291 category-bearing snapshots against 290 expected, category coverage 100%, collector errors 0, provider leakage 0, and all storage, freshness, real/non-empty, schema, and binding gates passing.

Kick permanent category capture remains unauthorized and unchanged. Category UI remains unauthorized until seven stable Twitch days are accepted.

### Following gates

1. 12A-4-24 separate Kick permanent-category decision.
2. 12A-5 seven stable Twitch days before provider-specific category UI work.
3. Provider-specific Heatmap category filter, then Day Flow category view, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products and databases.
- Cross-provider category identity and combined category rankings are not allowed.
- Existing Worker cadence remains \`*/5 * * * *\`.
- No backfill or retention expansion is authorized.
- Kick is not authorized by Twitch acceptance.
- Category UI is not yet authorized.

## Source of truth

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a4-twitch-permanent-category-final-acceptance.json\`
- \`docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md\`
`)

write('docs/product/current-schedule.md', `# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-21

\`\`\`text
Phase 12A Analytics Capture Foundation active
Twitch permanent category capture accepted and active yes
Twitch minimum 24-hour observation accepted yes
Temporary observation schedule current no
Kick permanent implementation authorized no
Existing Worker cadence */5 * * * * unchanged
Backfill no
Retention expansion no
Category UI no
Cross-provider category identity or ranking no
\`\`\`

## Active sequence

1. Preserve Twitch permanent category collection on the existing five-minute collector.
2. Begin the seven-day stable accumulation requirement for future provider-specific category UI.
3. Consider Kick only through a separate explicit decision.
4. Do not authorize category UI until the seven-day Twitch gate is accepted.

## Accepted Twitch observation

- Start: 2026-07-20T11:40:00Z.
- Final observation: 2026-07-21T11:51:02.829Z.
- Expected category snapshots: 290.
- Observed category snapshots: 291.
- Coverage: 100%.
- Collector errors: 0.
- Provider leakage: 0.
- 90-day projected size: 378.59 MB.
- Provider headroom: 71.41 MB.
- Account-wide headroom: 626.08 MB.
- Latest snapshot: real, non-empty, 300 streams, freshness 0.34 minutes.
- Warning extension: not required.
- Rollback: not required.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, active WIP, final Twitch acceptance, and development policy.
`)

write('docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md', `# 12A-4-23 Twitch permanent category capture accepted

## Status

Twitch permanent category capture is active and accepted after the minimum 24-hour observation. The final read-only evaluation classified the rollout as eligible for acceptance with no warnings and no hard stops.

## Final evidence

- Verification PR: #633.
- Workflow run: 29827696569.
- Workflow job: 88624752189.
- Artifact: 8493912964.
- Evidence: \`docs/audits/12a4-twitch-permanent-category-final-acceptance.json\`.
- Coverage: 291 observed / 290 expected, ratio 1.0.
- Collector errors: 0.
- Provider leakage: 0.
- Permanent flag: enabled.
- Obsolete canary bindings: absent.
- Storage and freshness gates: passed.
- Warning extension: not required.
- Rollback: not required.

## Current production state

- Twitch permanent category capture active: yes.
- Existing five-minute Worker cron unchanged.
- Kick permanent category capture authorized: no.
- Category UI authorized: no.
- Backfill authorized: no.
- Retention expansion authorized: no.
- Cross-provider identity or ranking authorized: no.

## Next gate

A separate Kick decision may be considered. Provider-specific category UI remains deferred until seven stable Twitch days are accepted.
`)

let index = read('docs/README.md')
index = index.replace(/canonical gate 12A-4-22[^\n]*/i, 'canonical gate 12A-4-23 Twitch permanent category capture accepted')
index = index.replace(/Twitch permanent category capture active yes|Twitch permanent category capture active no/i, 'Twitch permanent category capture active yes')
index = index.replace(/The canonical gate is 12A-4-22[^\n]*/i, 'The canonical gate is 12A-4-23. Twitch permanent category capture is active and accepted after the minimum 24-hour observation.')
if (!index.includes('12a4-twitch-permanent-category-final-acceptance.json')) {
  index += '\n- Final Twitch permanent-category acceptance: `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`\n'
}
write('docs/README.md', index)

console.log(JSON.stringify({ ok: true, gate: gate.schemaVersion, phase: gate.currentWorkstream.phase }, null, 2))
