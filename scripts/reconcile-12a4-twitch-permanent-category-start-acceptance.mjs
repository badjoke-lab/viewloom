import assert from 'node:assert/strict'
import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))
if (gate.schemaVersion === 'viewloom-12a2-current-gate-state-v26') {
  console.log('canonical gate already reconciled')
  process.exit(0)
}
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v25')
assert.equal(gate.currentWorkstream.phase, '12A-4-21')

const appendUnique = (values, value) => values.includes(value) ? values : [...values, value]
gate.schemaVersion = 'viewloom-12a2-current-gate-state-v26'
gate.status = '12a4_twitch_permanent_category_capture_active_observation_pending'
gate.categoryCapture.runtimeCaptureStarted = true
gate.categoryCapture.categoryCaptureFlagPresent = true
gate.categoryCapture.twitchPermanentRuntimeCaptureActive = true
gate.categoryCapture.twitchPermanentExactReleaseTriggerAccepted = true
gate.closedBlockers = appendUnique(gate.closedBlockers, 'twitch_permanent_category_capture_not_deployed')
gate.openBlockers = gate.openBlockers.filter((value) => value !== 'twitch_permanent_category_capture_not_deployed')
Object.assign(gate.currentWorkstream, {
  phase: '12A-4-22',
  name: 'Twitch permanent category capture active; minimum observation in progress',
  productionExecutionIncluded: true,
  runtimeCaptureStarted: true,
  twitchPermanentCaptureActive: true,
  exactDeploymentTriggerCurrent: false,
  exactReleaseTriggerCurrent: false,
  releaseTriggerPr: 630,
  releaseTriggerMergeSha: '3c262530fa234800a426dadb20148ee4f2219309',
  releaseStartAcceptancePr: 632,
  releaseStartedAt: '2026-07-20T11:40:00.000Z',
  initialStartVerifiedAt: '2026-07-20T11:46:02.963Z',
  initialStartVerified: true,
  initialCategoryPayloadRows: 2,
  initialProviderLeakageRows: 0,
  observationPackagePr: 632,
  observationActive: true,
  observationMinimumEndAt: '2026-07-21T11:40:00.000Z',
  observationWarningEndAt: '2026-07-22T11:40:00.000Z',
  automaticRollbackOnObservationHardStop: true,
})
if (gate.twitchPermanentCategoryReleasePackage) {
  Object.assign(gate.twitchPermanentCategoryReleasePackage, {
    status: 'started_and_release_path_retiring',
    exactTriggerPr: 630,
    exactTriggerMergeSha: '3c262530fa234800a426dadb20148ee4f2219309',
    exactTriggerPresent: false,
    productionRuntimeCaptureStarted: true,
    productionWorkerPublished: true,
    kickChanged: false,
  })
}
gate.twitchPermanentCategoryStart = {
  status: 'accepted',
  acceptancePr: 632,
  evidence: 'docs/audits/12a4-twitch-permanent-category-start-acceptance.json',
  releaseTriggerPr: 630,
  releaseTriggerMergeSha: '3c262530fa234800a426dadb20148ee4f2219309',
  startAt: '2026-07-20T11:40:00.000Z',
  verificationRunId: 29739415464,
  verificationJobId: 88342486922,
  artifactId: 8459811639,
  artifactDigest: 'sha256:40362301ce22eb6da23443db5ee2238dd13711118c3d6b1ecee2ebbd6fe4132e',
  evidenceDigest: 'sha256:0f2fa71dfdc5fce9149b4dc44e864e1eea407dd4ce86969f915ad3f3ea762a46',
  observedAt: '2026-07-20T11:46:02.963Z',
  permanentFlagPresent: true,
  obsoleteCanaryBindingsPresent: false,
  categoryPayloadRowsSinceStart: 2,
  providerLeakageRows: 0,
  collectorErrorRunsSinceStart: 0,
  latestStreamCount: 300,
  latestTotalViewers: 680566,
  projectedNinetyDaySizeMb: 374.41,
  projectedProviderHeadroomMb: 75.59,
  projectedAccountWideHeadroomMb: 728.87,
  allInitialGatesPass: true,
  kickChanged: false,
}
gate.twitchPermanentCategoryObservation = {
  status: 'active',
  packagePr: 632,
  contract: 'docs/audits/12a4-twitch-permanent-category-observation-contract.json',
  workflow: '.github/workflows/analytics-12a4-twitch-permanent-category-observation.yml',
  startAt: '2026-07-20T11:40:00.000Z',
  minimumEndAt: '2026-07-21T11:40:00.000Z',
  warningEndAt: '2026-07-22T11:40:00.000Z',
  temporaryGitHubScheduleActive: true,
  newWorkerCronAdded: false,
  automaticRollbackOnHardStop: true,
  finalAcceptancePending: true,
  kickChanged: false,
}
gate.nextWorkstream = 'complete the minimum 24-hour Twitch-only permanent category observation, extend to 48 hours on warning, then accept or restore the normal Twitch config and retire temporary observation paths'
fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)

fs.writeFileSync('docs/product/current-roadmap.md', `# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-20

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- 12A-0 through 12A-3 collection, retention, rollup, and intraday foundations.
- 12A-4 category source audit, storage design, migration, disabled runtime, schema apply, and bounded execution-cost acceptance.
- Provider-specific Kick and Twitch bounded canaries, rollback acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch-first and provider-separated.
- 12A-4-20 Twitch permanent implementation package acceptance.
- 12A-4-21 exact Twitch release package and initial production start acceptance.

### Current gate: 12A-4-22 Twitch permanent observation active

Twitch permanent category capture started at 2026-07-20 20:40 JST. Initial read-only verification accepted the permanent flag, two category-bearing snapshots, zero provider leakage, real non-empty fresh collection, and all storage gates.

The minimum 24-hour Twitch-only observation is active until no earlier than 2026-07-21 20:40 JST. A warning extends observation to 48 hours. A hard stop restores the normal category-disabled Twitch configuration automatically.

### Following gates

1. 12A-4-23 Twitch acceptance or rollback closeout and temporary-path retirement.
2. 12A-4-24 separate Kick decision.
3. 12A-5 seven stable days before provider-specific category UI.

## Hard boundaries

- Twitch permanent category capture is active; Kick permanent category capture is not authorized.
- Twitch and Kick remain separate data products and databases.
- The existing five-minute Worker cron remains unchanged; the hourly observer is a temporary GitHub Actions schedule only.
- Cross-provider category identity and combined category rankings are not allowed.
- No backfill or raw-retention expansion is authorized.
- Category analytics UI remains deferred until stable accumulation gates pass.
- Free-tier safety, read-only observation, and automatic restoration take precedence over feature breadth.

## Source of truth

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a4-twitch-permanent-category-start-acceptance.json\`
- \`docs/audits/12a4-twitch-permanent-category-observation-contract.json\`
- \`docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md\`
`)

fs.writeFileSync('docs/product/current-schedule.md', `# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-20

\`\`\`text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries complete and retired
12A-4-19 permanent rollout decision accepted
12A-4-20 Twitch permanent implementation package accepted
12A-4-21 Twitch permanent release start accepted
12A-4-22 Twitch permanent observation active
Twitch permanent runtime active yes
Exact release trigger current no
Temporary GitHub observation schedule active yes
Kick permanent implementation authorized no
Existing Worker cadence */5 * * * * unchanged
Backfill no
Retention expansion no
Category UI no
Cross-provider category identity or ranking no
\`\`\`

## Active sequence

1. Run the temporary hourly read-only Twitch observation.
2. Check the permanent flag, obsolete bindings, provider leakage, storage, freshness, real/non-empty snapshots, category coverage, and collector errors.
3. Restore the normal Twitch config automatically on a hard stop and verify normal snapshot recovery.
4. Continue until at least 2026-07-21 20:40 JST.
5. Extend to 2026-07-22 20:40 JST if any warning occurs.
6. Freeze final evidence, accept or roll back Twitch, and retire trigger/monitor paths.
7. Consider Kick only in a separate explicit decision after Twitch final acceptance.
8. Require seven stable days before category UI work.

## Twitch hard stops

- Permanent flag absent or false, or obsolete canary bindings present.
- Provider leakage greater than zero.
- Projected Twitch 90-day size greater than 440 MB or provider headroom below 10 MB.
- Projected account-wide D1 headroom below 500 MB.
- Latest collection stale, non-real, or empty.
- Category snapshot coverage below 0.80 after the initial grace window.
- Three or more collector error runs since activation.
- Unexpected Kick configuration, binding, data, or behavior change.

## Current operating state

- Twitch permanent category capture is active on the existing five-minute collector.
- Initial verification accepted 2 category rows, 0 leakage rows, 0 collector errors, and a real 300-stream snapshot.
- Kick normal collection continues unchanged and Kick permanent capture is unauthorized.
- The exact release trigger is retired by the start-acceptance package.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, active WIP, start acceptance, observation contract, and development policy.
`)

fs.writeFileSync('docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md', `# 12A-4-22 Twitch permanent category observation active

## Status

Twitch permanent category capture started at 2026-07-20 20:40 JST and passed initial read-only production verification. PR #632 freezes the start evidence, retires the exact release trigger path, and starts the minimum 24-hour Twitch-only observation package. Kick remains unauthorized and unchanged.

## Accepted start evidence

- Release trigger PR: #630.
- Release trigger merge: \`3c262530fa234800a426dadb20148ee4f2219309\`.
- Start boundary: \`2026-07-20T11:40:00.000Z\`.
- Verification run: \`29739415464\`.
- Verification job: \`88342486922\`.
- Verification artifact: \`8459811639\`.
- Artifact digest: \`sha256:40362301ce22eb6da23443db5ee2238dd13711118c3d6b1ecee2ebbd6fe4132e\`.
- Evidence: \`docs/audits/12a4-twitch-permanent-category-start-acceptance.json\`.

Initial accepted values: permanent flag true, obsolete canary bindings absent, category rows 2, provider leakage 0, collector errors 0, 300 streams, 680,566 viewers, projected 90-day size 374.41 MB, provider headroom 75.59 MB, and account-wide headroom 728.87 MB.

## Active observation

- Minimum end: 2026-07-21 20:40 JST.
- Warning extension end: 2026-07-22 20:40 JST.
- Monitoring: temporary hourly GitHub Actions schedule.
- Production reads: Cloudflare GET and D1 SELECT only.
- Hard-stop containment: restore the normal Twitch config and verify a new normal snapshot.
- New Worker cron: no.

## Current production state

- Twitch permanent category capture active: yes.
- Existing Twitch cadence: five minutes.
- Exact release trigger current: no.
- Kick change: no.
- Backfill or retention expansion: no.
- Category UI or cross-provider behavior: no.

## Next gate

After the minimum observation, freeze final read-only evidence. Accept Twitch only if storage, leakage, bindings, freshness, real/non-empty collection, category coverage, and collector health pass. Otherwise restore normal Twitch collection and freeze failure evidence. Retire all temporary observation paths in either case.

## Source documents

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-roadmap.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a4-twitch-permanent-category-start-acceptance.json\`
- \`docs/audits/12a4-twitch-permanent-category-observation-contract.json\`
- \`docs/operations/development-and-deployment-policy.md\`

## Current authorization

Twitch runtime active: yes.  
Twitch observation active: yes.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
`)

fs.writeFileSync('docs/README.md', `# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-20

## Current execution state

\`\`\`text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries accepted and retired
canonical gate 12A-4-22 Twitch permanent observation active
Twitch permanent implementation package accepted yes
Twitch permanent release start accepted yes
Twitch permanent category capture active yes
Exact release trigger current no
Temporary GitHub observation schedule active yes
Kick permanent implementation authorized no
normal Twitch cadence */5 * * * *
new Worker cron authorized no
backfill authorized no
retention expansion authorized no
category UI authorized no
cross-provider identity or combined ranking authorized no
\`\`\`

## Read first

1. \`docs/operations/development-and-deployment-policy.md\`
2. \`docs/product/category-capture-permanent-rollout-spec.md\`
3. \`docs/product/category-capture-permanent-rollout-plan.md\`
4. \`docs/product/current-roadmap.md\`
5. \`docs/product/current-schedule.md\`
6. \`docs/audits/12a2-current-gate-state.json\`
7. \`docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md\`
8. \`docs/audits/12a4-twitch-permanent-category-start-acceptance.json\`
9. \`docs/audits/12a4-twitch-permanent-category-observation-contract.json\`
10. \`docs/audits/12a4-twitch-permanent-category-capture-package-contract.json\`
11. \`docs/audits/12a4-twitch-permanent-category-release-contract.json\`

## Current category evidence chain

- Source and storage evidence remain accepted and provider-separated.
- Final Kick and Twitch bounded-canary evidence remains historical accepted evidence.
- Twitch permanent implementation and release packages are accepted.
- Twitch permanent start evidence: \`docs/audits/12a4-twitch-permanent-category-start-acceptance.json\`.
- Active observation contract: \`docs/audits/12a4-twitch-permanent-category-observation-contract.json\`.

## Current gate

The canonical gate is 12A-4-22. Twitch permanent category capture is active on the existing five-minute collector and passed initial start verification. The minimum 24-hour Twitch-only observation is active.

The temporary hourly GitHub Actions observer performs Cloudflare GET and D1 SELECT checks. A hard stop restores the normal category-disabled Twitch configuration and verifies normal snapshot recovery. No new Worker cron exists.

Kick remains unauthorized pending Twitch final acceptance and a separate explicit decision. Category UI, backfill, retention expansion, cross-provider identity, and combined rankings remain unauthorized.

## Invariants

- Twitch and Kick remain separate.
- Twitch activation does not authorize Kick.
- Normal collector cadence remains five minutes.
- The observation schedule is temporary GitHub Actions infrastructure, not a Worker cron.
- No backfill, retention expansion, category UI, cross-provider identity, or combined ranking is authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Production workflows require explicit contracts, sanitized evidence, and retirement steps.
`)

const observationContractPath = 'docs/audits/12a4-twitch-permanent-category-observation-contract.json'
const observationContract = JSON.parse(fs.readFileSync(observationContractPath, 'utf8'))
observationContract.status = 'active'
fs.writeFileSync(observationContractPath, `${JSON.stringify(observationContract, null, 2)}\n`)

console.log(JSON.stringify({ ok: true, phase: gate.currentWorkstream.phase, status: gate.status }, null, 2))
