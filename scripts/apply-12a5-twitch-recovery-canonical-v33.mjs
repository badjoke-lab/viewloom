import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

const START_AT = '2026-07-29T05:30:00.000Z'
const EARLIEST_AUDIT_AT = '2026-08-05T05:30:00.000Z'
const ACCEPTANCE_PR = 657
const ACCEPTANCE_MERGE_SHA = '5565640b26a0fe8e896e5c47eb054b3363f50463'
const EVIDENCE_PATH = 'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json'
const RECOVERY_RUN_ID = 30423637234
const RECOVERY_JOB_ID = 90485345119
const RECOVERY_ARTIFACT_ID = 8713465427
const RECOVERY_ARTIFACT_DIGEST = 'sha256:5d910123497abbded3400eb89253e51d14083f11dc8aa814cb9071f17048161f'

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = readJson(gatePath)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v32')
assert.equal(gate.status, '12a5_twitch_permanent_category_capture_regressed_recovery_required')
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.twitchRecoveryRequired, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v33'
gate.status = '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active'

gate.categoryCapture.twitchPermanentRuntimeCaptureActive = true
gate.categoryCapture.twitchStableAccumulationStartAt = START_AT
gate.categoryCapture.twitchStableAccumulationEarliestAuditAt = EARLIEST_AUDIT_AT
gate.categoryCapture.twitchRecoveryAccepted = true
gate.categoryCapture.twitchRecoveryAcceptancePr = ACCEPTANCE_PR
gate.categoryCapture.twitchRecoveryAcceptanceMergeSha = ACCEPTANCE_MERGE_SHA
gate.categoryCapture.twitchRecoveryAcceptanceEvidence = EVIDENCE_PATH
gate.categoryCapture.twitchSevenDayAccumulationActive = true

const recoveredBlocker = 'twitch_permanent_category_capture_regression_not_recovered'
gate.closedBlockers = [...new Set([...gate.closedBlockers, recoveredBlocker])]
gate.openBlockers = gate.openBlockers.filter((item) => item !== recoveredBlocker)
assert.deepEqual(gate.openBlockers, [
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
])

Object.assign(gate.currentWorkstream, {
  phase: '12A-5B-R2',
  name: 'Twitch permanent category capture recovered; seven-day stability accumulation active',
  twitchPermanentCaptureActive: true,
  twitchRecoveryRequired: false,
  twitchStableAccumulationResetRequired: false,
  twitchRecoveryAccepted: true,
  twitchRecoveryAcceptancePr: ACCEPTANCE_PR,
  twitchRecoveryAcceptanceMergeSha: ACCEPTANCE_MERGE_SHA,
  twitchRecoveryAcceptanceEvidence: EVIDENCE_PATH,
  twitchRecoveryStartedAt: START_AT,
  twitchStableAccumulationStartAt: START_AT,
  twitchStableAccumulationEarliestAuditAt: EARLIEST_AUDIT_AT,
  publicCategoryUiEarliestAuditAt: EARLIEST_AUDIT_AT,
  exactTwitchRecoveryTriggerCurrent: false,
})

gate.nextWorkstream = `run the replacement read-only Twitch seven-day accumulation audit at or after ${EARLIEST_AUDIT_AT}; keep public category-filter exposure unauthorized until a separate accepted cutover PR`

const filterTrack = gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter
filterTrack.earliestAccumulationAuditAt = EARLIEST_AUDIT_AT
filterTrack.recoveryRequired = false
filterTrack.stableAccumulationActive = true
filterTrack.stableAccumulationStartAt = START_AT

gate.twitchHeatmapCategoryFilterHiddenDecision.earliestAccumulationAuditAt = EARLIEST_AUDIT_AT

gate.twitchPermanentCategoryRegression.status = 'recovered'
gate.twitchPermanentCategoryRegression.recoveryAcceptancePr = ACCEPTANCE_PR
gate.twitchPermanentCategoryRegression.recoveryAcceptanceMergeSha = ACCEPTANCE_MERGE_SHA
gate.twitchPermanentCategoryRegression.recoveryAcceptanceEvidence = EVIDENCE_PATH
gate.twitchPermanentCategoryRegression.recoveredAt = START_AT
gate.twitchPermanentCategoryRegression.originalSevenDayClockValid = false
gate.twitchPermanentCategoryRegression.publicExposureAuthorized = false

Object.assign(gate.twitchPermanentCategoryRecoveryPackage, {
  status: 'accepted_executed_and_retired',
  triggerPr: 655,
  triggerMergeSha: '40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4',
  recoveryRunId: RECOVERY_RUN_ID,
  recoveryJobId: RECOVERY_JOB_ID,
  recoveryArtifactId: RECOVERY_ARTIFACT_ID,
  recoveryArtifactDigest: RECOVERY_ARTIFACT_DIGEST,
  acceptancePr: ACCEPTANCE_PR,
  acceptanceMergeSha: ACCEPTANCE_MERGE_SHA,
  acceptanceEvidence: EVIDENCE_PATH,
  startAt: START_AT,
  earliestSevenDayAuditAt: EARLIEST_AUDIT_AT,
  runtimeActive: true,
  productionWorkerPublished: true,
  remoteD1MutationPerformed: false,
  kickChanged: false,
  publicExposureEnabled: false,
  rollbackRequired: false,
  triggerRetired: true,
  workflowRetired: true,
})

gate.twitchPermanentCategoryRecoveryAcceptance = {
  status: 'accepted',
  provider: 'twitch',
  trackingIssue: 652,
  acceptancePr: ACCEPTANCE_PR,
  acceptanceMergeSha: ACCEPTANCE_MERGE_SHA,
  evidence: EVIDENCE_PATH,
  workflowRunId: RECOVERY_RUN_ID,
  workflowJobId: RECOVERY_JOB_ID,
  artifactId: RECOVERY_ARTIFACT_ID,
  artifactDigest: RECOVERY_ARTIFACT_DIGEST,
  startAt: START_AT,
  earliestSevenDayAuditAt: EARLIEST_AUDIT_AT,
  finalReadOnlyPreflightPassed: true,
  twitchOnlyPermanentConfigDeployed: true,
  consecutiveCategorySnapshotsObserved: 2,
  permanentBindingPresent: true,
  existingFiveMinuteCronPreserved: true,
  providerLeakageRows: 0,
  storageGatesPassed: true,
  rollbackRequired: false,
  kickChanged: false,
  publicExposureAuthorized: false,
}

assert.equal(gate.categoryCapture.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
writeJson(gatePath, gate)

const recoveryPath = 'docs/audits/12a5-twitch-permanent-category-recovery-contract.json'
const recovery = readJson(recoveryPath)
assert.equal(recovery.status, 'accepted')
assert.equal(recovery.acceptance.packagePr, 653)
recovery.lifecycleStatus = 'executed_accepted_and_retired'
recovery.workflow.retired = true
recovery.workflow.retiredByPr = ACCEPTANCE_PR
recovery.workflow.productionEventCompleted = true
recovery.trigger.status = 'retired'
recovery.trigger.triggerPr = 655
recovery.trigger.triggerMergeSha = '40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4'
recovery.trigger.startAt = START_AT
recovery.postRecovery.canonicalAcceptanceRequired = false
recovery.postRecovery.newStableAccumulationStartRequired = false
recovery.postRecovery.newSevenDayAuditRequired = true
Object.assign(recovery.acceptance, {
  triggerPr: 655,
  triggerMergeSha: '40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4',
  recoveryRunId: RECOVERY_RUN_ID,
  recoveryJobId: RECOVERY_JOB_ID,
  recoveryArtifactId: RECOVERY_ARTIFACT_ID,
  recoveryArtifactDigest: RECOVERY_ARTIFACT_DIGEST,
  canonicalAcceptancePr: ACCEPTANCE_PR,
  canonicalAcceptanceMergeSha: ACCEPTANCE_MERGE_SHA,
  canonicalAcceptanceEvidence: EVIDENCE_PATH,
  verifiedRecoveryStartAt: START_AT,
  earliestSevenDayAuditAt: EARLIEST_AUDIT_AT,
  productionRuntimeCaptureStarted: true,
  productionWorkerPublished: true,
  remoteD1MutationPerformed: false,
  kickChanged: false,
  publicExposureEnabled: false,
  rollbackRequired: false,
  triggerRetired: true,
  workflowRetired: true,
})
writeJson(recoveryPath, recovery)

const hiddenDecisionPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json'
const hiddenDecision = readJson(hiddenDecisionPath)
hiddenDecision.publicGate.twitchPermanentStartAt = START_AT
hiddenDecision.publicGate.earliestAuditAt = EARLIEST_AUDIT_AT
hiddenDecision.publicGate.originalStartInvalidatedByRegression = true
hiddenDecision.publicGate.recoveryAcceptancePr = ACCEPTANCE_PR
hiddenDecision.authorization.publicExposureAuthorized = false
hiddenDecision.authorization.publicNavigationAuthorized = false
hiddenDecision.authorization.defaultRouteControlAuthorized = false
writeJson(hiddenDecisionPath, hiddenDecision)

const hiddenControlsPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json'
const hiddenControls = readJson(hiddenControlsPath)
hiddenControls.publicGate.earliestAuditAt = EARLIEST_AUDIT_AT
hiddenControls.publicGate.recoveryStartAt = START_AT
hiddenControls.publicGate.recoveryAcceptancePr = ACCEPTANCE_PR
hiddenControls.nextGate = `run the replacement seven-day Twitch accumulation audit at or after ${EARLIEST_AUDIT_AT} while public exposure remains disabled; use a separate public cutover PR only after acceptance`
hiddenControls.acceptance.publicExposureEnabled = false
writeJson(hiddenControlsPath, hiddenControls)

const roadmap = `# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-29

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- Twitch permanent category capture initially launched and passed its first observation gate.
- Kick permanent category capture completed its minimum observation and was accepted in PR #648.
- The first Twitch seven-day audit in PR #651 correctly rejected a production configuration regression.
- Provider-scoped collector deployment protection and the dormant Twitch recovery package were accepted in PR #653 and PR #654.
- The guarded Twitch-only recovery was triggered by PR #655, succeeded in run \`${RECOVERY_RUN_ID}\`, and was accepted and retired in PR #657.

### Current gate: replacement Twitch seven-day accumulation

Kick permanent category capture remains accepted and active on the existing five-minute collector.

Twitch permanent category capture was recovered through PR #655 and accepted in PR #657. The permanent binding is active, two consecutive real and non-empty category-bearing snapshots passed, provider leakage remained zero, storage gates passed, rollback was not required, and Kick was unchanged.

The replacement stability clock started at \`${START_AT}\`. The earliest replacement read-only seven-day audit is \`${EARLIEST_AUDIT_AT}\`.

The original clock that began on 2026-07-20 remains invalid. Public Twitch Heatmap category-filter exposure remains unauthorized.

### Active deliverables

#### Track A — Kick

1. Preserve the accepted Kick permanent configuration and five-minute cadence.
2. Do not deploy or mutate Kick from Twitch-only work.
3. Do not add Kick category UI without separate evidence and authorization.

#### Track B — Twitch hidden filter

1. Accumulate uninterrupted category-bearing Twitch snapshots from \`${START_AT}\`.
2. Run the replacement read-only seven-day audit at or after \`${EARLIEST_AUDIT_AT}\`.
3. Verify cadence, permanent binding, coverage, reference resolution, zero leakage, errors, freshness, and storage headroom.
4. Keep hidden controls non-public throughout the audit.
5. Only after accepted audit evidence, use a separate public cutover PR.

### Following gates

1. 12A-5B-R2 replacement Twitch seven-day accumulation audit.
2. 12A-5C public Twitch Heatmap category-filter cutover only after accepted audit evidence.
3. Kick category UI only after separate Kick stable-accumulation and UI authorization evidence.
4. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains \`*/5 * * * *\` for both providers.
- No new Worker cron, backfill, or retention expansion is authorized.
- Twitch audit work must not mutate Kick.
- Hidden Twitch controls must not become public before the replacement seven-day audit and separate cutover acceptance.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a5-twitch-permanent-category-recovery-contract.json\`
- \`${EVIDENCE_PATH}\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-final-acceptance.json\`
- \`docs/work-in-progress/phase12a4-category-parallel-execution.md\`
`
writeFileSync('docs/product/current-roadmap.md', roadmap)

const schedule = `# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-29

\`\`\`text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit
Twitch permanent category capture active yes
Twitch recovery required no
Original Twitch seven-day clock valid no
Replacement Twitch seven-day clock active yes
Replacement Twitch seven-day clock start ${START_AT}
Replacement Twitch seven-day audit earliest ${EARLIEST_AUDIT_AT}
Kick permanent runtime active yes
Twitch Heatmap hidden category API package accepted yes
Twitch Heatmap hidden control package accepted yes
Twitch Heatmap public category-filter exposure authorized no
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
\`\`\`

## Recovery acceptance

- Trigger PR: #655; merge \`40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4\`.
- Recovery run/job/artifact: \`${RECOVERY_RUN_ID}\` / \`${RECOVERY_JOB_ID}\` / \`${RECOVERY_ARTIFACT_ID}\`.
- Acceptance PR: #657; merge \`${ACCEPTANCE_MERGE_SHA}\`.
- Verified start: \`${START_AT}\`.
- Final read-only preflight: passed.
- Twitch permanent config only: deployed.
- Consecutive category-bearing snapshots: 2, real, non-empty, and fresh.
- Permanent binding: present.
- Provider leakage: 0.
- Existing cadence: unchanged at \`*/5 * * * *\`.
- Storage gates: passed.
- Rollback: not required.
- Kick mutation: none.

## Track A — Kick permanent category capture

1. Preserve the accepted Kick permanent configuration and five-minute cadence.
2. Do not redeploy Kick from Twitch-only source changes.
3. Do not add Kick category UI without separate evidence and authorization.

## Track B — replacement Twitch seven-day accumulation

Required order:

1. Preserve uninterrupted Twitch permanent category capture from \`${START_AT}\`.
2. At or after \`${EARLIEST_AUDIT_AT}\`, run a read-only seven-day accumulation audit.
3. Verify every expected five-minute slot or explain bounded gaps without inventing data.
4. Verify permanent binding, category contract, freshness, real/non-empty payloads, zero leakage, safe storage headroom, and no Kick mutation.
5. Freeze accepted audit evidence canonically.
6. Keep public exposure disabled unless a later separate cutover PR is accepted.

## Public Twitch cutover

Blocked. A later separate PR must cite an accepted post-recovery seven-day audit, enable only the normal Twitch Heatmap category control, retain \`All categories\` and the unfiltered fallback, expose no Kick category UI, and pass browser, mobile, accessibility, and data-truth checks.

## Hard stops

- permanent binding becomes absent;
- category-bearing collection stops or becomes stale;
- provider leakage exceeds zero;
- projected Twitch 90-day size exceeds 440 MB or provider headroom falls below 10 MB;
- projected account-wide D1 headroom falls below 500 MB;
- any Kick configuration, binding, row, API, UI, or runtime mutation;
- any cadence, D1 schema, backfill, retention, or cross-provider change;
- any public category-filter exposure before accepted audit and separate cutover.

## Mandatory references

1. \`docs/product/category-capture-permanent-rollout-spec.md\`;
2. \`docs/product/category-capture-permanent-rollout-plan.md\`;
3. \`docs/product/current-roadmap.md\`;
4. this schedule;
5. \`docs/audits/12a2-current-gate-state.json\`;
6. \`docs/audits/12a5-twitch-permanent-category-recovery-contract.json\`;
7. \`${EVIDENCE_PATH}\`;
8. \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json\`;
9. \`docs/work-in-progress/phase12a4-category-parallel-execution.md\`;
10. \`docs/operations/development-and-deployment-policy.md\`.
`
writeFileSync('docs/product/current-schedule.md', schedule)

const wip = `# 12A-5B-R2 replacement Twitch seven-day accumulation

## Status

Kick permanent category capture is accepted and active. Twitch permanent category capture was recovered, verified, accepted, and is active again.

- Recovery trigger PR: #655.
- Recovery acceptance and execution-path retirement PR: #657.
- Recovery run/job/artifact: \`${RECOVERY_RUN_ID}\` / \`${RECOVERY_JOB_ID}\` / \`${RECOVERY_ARTIFACT_ID}\`.
- Replacement stability start: \`${START_AT}\`.
- Earliest replacement audit: \`${EARLIEST_AUDIT_AT}\`.

Public Twitch category-filter exposure remains unauthorized. The original seven-day stability clock is invalid; only the replacement clock above is current.

## Recovery result

- Final preflight was read-only and passed.
- Only \`workers/collector-twitch/wrangler.category-permanent.toml\` was deployed.
- Two consecutive real, non-empty, fresh category-bearing snapshots passed.
- \`CATEGORY_CAPTURE_ENABLED=true\` is present.
- Existing cadence remains \`*/5 * * * *\`.
- Provider leakage is zero.
- Storage gates passed.
- Rollback was not required.
- Kick was unchanged.
- Trigger and production recovery workflow were retired in PR #657.

## Track A — Kick permanent capture

- Final acceptance PR: #648.
- Permanent config: \`workers/collector-kick/wrangler.category-permanent.toml\`.
- Runtime active: yes.
- Existing cadence: \`*/5 * * * *\`.
- Twitch-only work must not deploy, mutate, or otherwise change Kick.

## Track B — replacement Twitch accumulation

1. Accumulate category-bearing snapshots continuously from \`${START_AT}\`.
2. Keep the permanent Twitch binding and existing five-minute cadence unchanged.
3. At or after \`${EARLIEST_AUDIT_AT}\`, run the replacement read-only seven-day accumulation audit.
4. Verify expected slots, real/non-empty/fresh snapshots, category references, collector errors, zero leakage, and storage headroom.
5. Freeze accepted evidence in canonical state.
6. Keep hidden controls non-public until a separate public cutover PR is accepted.

## Recovery history retained

- Rejected audit issue: #650.
- Recovery tracking issue: #652.
- Root-cause workflow run/job: \`30003576549\` / \`89194219805\`.
- Last category snapshot before regression: \`2026-07-23T11:35:00.000Z\`.
- First category-disabled snapshot: \`2026-07-23T11:40:00.000Z\`.
- The original clock remains invalid and cannot authorize public UI.

## Shared boundaries

- Twitch and Kick remain provider-separated.
- Existing cadence remains \`*/5 * * * *\` for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion.
- No cross-provider identity, mapping, totals, or rankings.
- No public Twitch category UI before accepted replacement audit and separate cutover.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-roadmap.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a5-twitch-permanent-category-recovery-contract.json\`
- \`${EVIDENCE_PATH}\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-final-acceptance.json\`
- \`docs/operations/development-and-deployment-policy.md\`
`
writeFileSync('docs/work-in-progress/phase12a4-category-parallel-execution.md', wip)

const verifierPath = 'scripts/verify-category-rollout-policy.mjs'
let verifier = readFileSync(verifierPath, 'utf8')
const replacements = [
  ["  'Twitch permanent category capture is **not currently active**',", "  'Twitch permanent category capture was recovered through PR #655 and accepted in PR #657',"],
  ["  'Canonical target 12A-5B-R1 Twitch permanent-category recovery',\n  'Twitch permanent category capture active no',\n  'Original Twitch seven-day clock valid no',", "  'Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit',\n  'Twitch permanent category capture active yes',\n  'Twitch recovery required no',\n  'Original Twitch seven-day clock valid no',\n  'Replacement Twitch seven-day clock active yes',"],
  ["  'Deploy only `workers/collector-twitch/wrangler.category-permanent.toml`.',", "  'Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z',"],
  ["  '# 12A-5B-R1 Twitch permanent-category recovery',", "  '# 12A-5B-R2 replacement Twitch seven-day accumulation',"],
  ["  '## Confirmed root cause',", "  '## Recovery result',"],
  ["  'Hidden controls package PR: #640.',", "  'Recovery acceptance and execution-path retirement PR: #657.',"],
  ["  'The original seven-day stability clock is invalid',", "  'The original seven-day stability clock is invalid',"],
  ["assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v32')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')"],
  ["assert.equal(gate.status, '12a5_twitch_permanent_category_capture_regressed_recovery_required')", "assert.equal(gate.status, '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active')"],
  ["assert.equal(gate.currentWorkstream.phase, '12A-5B-R1')", "assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')"],
  ["assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)", "assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)"],
  ["assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, null)", "assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, '2026-08-05T05:30:00.000Z')"],
  ["assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)", "assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)"],
  ["assert.deepEqual(gate.openBlockers, [\n  'twitch_permanent_category_capture_regression_not_recovered',\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])", "assert.deepEqual(gate.openBlockers, [\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])\nassert.ok(gate.closedBlockers.includes('twitch_permanent_category_capture_regression_not_recovered'))"],
  ["assert.equal(gate.currentWorkstream.twitchRecoveryRequired, true)", "assert.equal(gate.currentWorkstream.twitchRecoveryRequired, false)"],
  ["assert.equal(gate.currentWorkstream.twitchStableAccumulationResetRequired, true)", "assert.equal(gate.currentWorkstream.twitchStableAccumulationResetRequired, false)\nassert.equal(gate.currentWorkstream.twitchStableAccumulationStartAt, '2026-07-29T05:30:00.000Z')\nassert.equal(gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt, '2026-08-05T05:30:00.000Z')"],
  ["assert.equal(gate.twitchPermanentCategoryRegression.status, 'confirmed_recovery_required')", "assert.equal(gate.twitchPermanentCategoryRegression.status, 'recovered')"],
  ["assert.equal(gate.twitchPermanentCategoryRecoveryPackage.status, 'accepted_dormant')", "assert.equal(gate.twitchPermanentCategoryRecoveryPackage.status, 'accepted_executed_and_retired')"],
  ["assert.equal(gate.twitchPermanentCategoryRecoveryPackage.runtimeActive, false)", "assert.equal(gate.twitchPermanentCategoryRecoveryPackage.runtimeActive, true)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.acceptancePr, 657)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.triggerRetired, true)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.workflowRetired, true)"],
  ["assert.equal(hiddenTwitchDecision.publicGate.earliestAuditAt, '2026-07-27T11:40:00.000Z')", "assert.equal(hiddenTwitchDecision.publicGate.earliestAuditAt, '2026-08-05T05:30:00.000Z')"],
  ["  twitchRuntimeActive: false,", "  twitchRuntimeActive: true,"],
  ["  twitchRecoveryRequired: true,", "  twitchRecoveryRequired: false,"],
  ["  earliestPublicAuditAt: null,", "  earliestPublicAuditAt: '2026-08-05T05:30:00.000Z',"],
  ["  nextAction: 'twitch-permanent-category-recovery',", "  nextAction: 'replacement-twitch-seven-day-accumulation-audit',"],
]
for (const [from, to] of replacements) {
  assert.ok(verifier.includes(from), `verifier replacement source missing: ${from}`)
  verifier = verifier.replace(from, to)
}
writeFileSync(verifierPath, verifier)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: gate.schemaVersion,
  status: gate.status,
  phase: gate.currentWorkstream.phase,
  twitchRuntimeActive: gate.currentWorkstream.twitchPermanentCaptureActive,
  kickRuntimeActive: gate.currentWorkstream.kickPermanentCaptureActive,
  stableAccumulationStartAt: gate.currentWorkstream.twitchStableAccumulationStartAt,
  earliestAuditAt: gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt,
  publicExposureAuthorized: gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized,
}, null, 2))
