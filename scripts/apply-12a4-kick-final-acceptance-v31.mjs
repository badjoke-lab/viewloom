import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, value) => fs.writeFileSync(path, `${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`)
const replaceOnce = (source, before, after, label = before) => {
  if (!source.includes(before)) throw new Error(`missing fragment: ${label}`)
  return source.replace(before, after)
}
const addUnique = (items, value) => items.includes(value) ? items : [...items, value]

const acceptancePr = 648
const finalPath = 'docs/audits/12a4-kick-permanent-category-final-acceptance.json'
const observationPath = 'docs/audits/12a4-kick-permanent-category-observation-contract.json'

const finalAcceptance = {
  schemaVersion: 'viewloom-12a4-kick-permanent-category-final-acceptance-v1',
  status: 'accepted',
  trackingIssue: 634,
  provider: 'kick',
  startAt: '2026-07-25T07:10:00.000Z',
  observedAt: '2026-07-26T07:55:58.650Z',
  minimumObservationHours: 24,
  minimumReached: true,
  warningExtensionRequired: false,
  rollbackRequired: false,
  source: {
    acceptancePr,
    workflowRunId: 30193672205,
    workflowJobId: 89771280558,
    artifactId: 8629415129,
    artifactDigest: 'sha256:280bff0acf2a4190fb7678e5150499290b396eb89fb0ac80b27f1dea3116b14a',
  },
  bindings: {
    permanentCaptureEnabled: true,
    obsoleteCanaryBindingsPresent: false,
  },
  data: {
    expectedCategoryRows: 298,
    observedCategoryRows: 298,
    categoryCoverageRatio: 1,
    kickDictionaryRows: 261,
    providerLeakageRows: 0,
    collectorHealthProxyClear: true,
    latestSnapshot: {
      bucketMinute: '2026-07-26T07:55:00.000Z',
      collectedAt: '2026-07-26T07:55:18.404Z',
      streamCount: 100,
      totalViewers: 263851,
      sourceMode: 'authenticated',
      categoryContractVersion: 'category-source-v1',
      freshnessMinutes: 0.67,
    },
  },
  storage: {
    providerCurrentMb: 321.36,
    accountCurrentMb: 3680.09,
    projectedNinetyDaySizeMb: 369.68,
    projectedProviderHeadroomMb: 80.32,
    projectedAccountWideHeadroomMb: 879.59,
  },
  gates: {
    readOnly: true,
    exactIdentity: true,
    cadencePass: true,
    storagePass: true,
    schemaPass: true,
    providerLeakagePass: true,
    bindingsPass: true,
    collectorHealthPass: true,
    latestSnapshotFreshnessPass: true,
    latestSnapshotRealPass: true,
    latestSnapshotNonemptyPass: true,
    categorySnapshotPass: true,
    rollbackNormalSnapshotPass: true,
    hardStops: [],
    warnings: [],
  },
  boundaries: {
    twitchChanged: false,
    cadenceChanged: false,
    newWorkerCronAdded: false,
    backfillPerformed: false,
    retentionChanged: false,
    categoryUiChanged: false,
    crossProviderBehaviorChanged: false,
  },
  nextGate: 'Twitch seven-day accumulation audit at or after 2026-07-27T11:40:00.000Z; public category-filter cutover remains separate and unauthorized',
}
write(finalPath, finalAcceptance)

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(read(gatePath))
gate.schemaVersion = 'viewloom-12a2-current-gate-state-v31'
gate.status = '12a4_kick_permanent_category_capture_accepted'
gate.categoryCapture.kickPermanentRuntimeCaptureActive = true
gate.categoryCapture.kickPermanentObservationAccepted = true
gate.closedBlockers = addUnique(addUnique(gate.closedBlockers, 'kick_permanent_category_capture_not_deployed'), 'kick_permanent_category_capture_observation_not_accepted')
gate.openBlockers = [
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
]
Object.assign(gate.currentWorkstream, {
  name: 'Kick permanent category capture accepted; Twitch seven-day accumulation audit next',
  kickPermanentCaptureActive: true,
  kickPermanentObservationAccepted: true,
  kickObservationActive: false,
  kickObservationScheduleCurrent: false,
  kickWarningExtensionRequired: false,
  kickRollbackRequired: false,
  kickFinalAcceptancePr: acceptancePr,
})
gate.nextWorkstream = 'run the Twitch seven-day accumulation audit at or after 2026-07-27T11:40:00.000Z; keep public category-filter exposure disabled until a separate accepted cutover PR'
Object.assign(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture, {
  runtimeActive: true,
  observationAccepted: true,
  finalAcceptancePr: acceptancePr,
  finalAcceptanceEvidence: finalPath,
})
Object.assign(gate.categoryParallelPackageAcceptance.kick, {
  runtimeActive: true,
  observationAccepted: true,
  finalAcceptancePr: acceptancePr,
  finalAcceptanceEvidence: finalPath,
})
Object.assign(gate.kickPermanentCategoryDecision, {
  status: 'accepted_and_active',
  runtimeActive: true,
})
gate.kickPermanentCategoryObservation = {
  status: 'accepted_and_retired',
  packagePr: 645,
  contract: observationPath,
  workflow: '.github/workflows/analytics-12a4-kick-permanent-category-observation.yml',
  startAt: '2026-07-25T07:10:00.000Z',
  minimumEndAt: '2026-07-26T07:10:00.000Z',
  warningEndAt: '2026-07-27T07:10:00.000Z',
  temporaryGitHubScheduleActive: false,
  newWorkerCronAdded: false,
  automaticRollbackOnHardStop: true,
  finalAcceptancePending: false,
  twitchChanged: false,
}
gate.kickPermanentCategoryFinalAcceptance = {
  status: 'accepted',
  trackingIssue: 634,
  provider: 'kick',
  evidence: finalPath,
  acceptancePr,
  workflowRunId: 30193672205,
  workflowJobId: 89771280558,
  artifactId: 8629415129,
  artifactDigest: finalAcceptance.source.artifactDigest,
  observedAt: finalAcceptance.observedAt,
  expectedCategoryRows: 298,
  observedCategoryRows: 298,
  categoryCoverageRatio: 1,
  kickDictionaryRows: 261,
  providerLeakageRows: 0,
  projectedNinetyDaySizeMb: 369.68,
  projectedProviderHeadroomMb: 80.32,
  projectedAccountWideHeadroomMb: 879.59,
  warningExtensionRequired: false,
  rollbackRequired: false,
  twitchChanged: false,
}
write(gatePath, gate)

const observation = JSON.parse(read(observationPath))
observation.status = 'accepted_and_retired'
observation.monitor.temporaryGitHubSchedule = false
observation.monitor.retiredByPr = acceptancePr
observation.acceptance.finalAcceptance = finalPath
observation.acceptance.finalAcceptancePr = acceptancePr
observation.acceptance.minimumReached = true
observation.acceptance.warningExtensionRequired = false
observation.acceptance.rollbackRequired = false
observation.acceptance.workflowRunId = 30193672205
observation.acceptance.workflowJobId = 89771280558
observation.acceptance.artifactId = 8629415129
observation.acceptance.artifactDigest = finalAcceptance.source.artifactDigest
write(observationPath, observation)

const decisionPath = 'docs/audits/12a4-kick-permanent-category-decision-contract.json'
const decision = JSON.parse(read(decisionPath))
decision.status = 'accepted_and_active'
decision.decision.runtimeActive = true
decision.finalAcceptance = {
  status: 'accepted',
  pr: acceptancePr,
  evidence: finalPath,
  warningExtensionRequired: false,
  rollbackRequired: false,
}
write(decisionPath, decision)

const releasePath = 'docs/audits/12a4-kick-permanent-category-release-contract.json'
const release = JSON.parse(read(releasePath))
release.nextGate = 'completed: production start and minimum 24-hour observation accepted in PR #648; temporary observation workflow retired'
release.finalAcceptance = {
  pr: acceptancePr,
  evidence: finalPath,
  workflowRunId: 30193672205,
  workflowJobId: 89771280558,
  artifactId: 8629415129,
  rollbackRequired: false,
}
write(releasePath, release)

const readmePath = 'docs/README.md'
let readme = read(readmePath)
readme = replaceOnce(readme, 'Last updated: 2026-07-23', 'Last updated: 2026-07-26')
readme = replaceOnce(readme, 'canonical target 12A-4-24 category parallel execution', 'canonical target 12A-4-24 Kick accepted; Twitch seven-day audit next')
readme = replaceOnce(readme, 'Kick permanent runtime active no', 'Kick permanent runtime active yes')
readme = replaceOnce(readme, '10. `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`', '10. `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`\n11. `docs/audits/12a4-kick-permanent-category-final-acceptance.json`')
readme = replaceOnce(readme, '- Kick permanent rollout authorization: `docs/audits/12a4-kick-permanent-category-decision-contract.json`.', '- Kick permanent rollout authorization: `docs/audits/12a4-kick-permanent-category-decision-contract.json`.\n- Final Kick permanent-category acceptance: `docs/audits/12a4-kick-permanent-category-final-acceptance.json`.')
readme = replaceOnce(readme, 'The canonical target is 12A-4-24. Twitch permanent category capture is accepted and active. Kick permanent capture implementation and guarded rollout are authorized, but Kick runtime remains inactive until package acceptance, fresh preflight, and an exact release trigger.', 'The canonical target is 12A-4-24. Twitch and Kick permanent category capture are accepted and active on their existing five-minute collectors. Kick completed its minimum 24-hour observation without warning or rollback, and the temporary hourly monitor is retired.')
write(readmePath, readme)

const roadmapPath = 'docs/product/current-roadmap.md'
let roadmap = read(roadmapPath)
roadmap = replaceOnce(roadmap, 'Last updated: 2026-07-25', 'Last updated: 2026-07-26')
roadmap = replaceOnce(roadmap, '- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.', '- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.\n- Kick permanent category capture started through PR #643, completed the minimum 24-hour observation, and was accepted in PR #648 without rollback.')
roadmap = replaceOnce(roadmap, '### Current gate: exact Kick release and Twitch seven-day audit', '### Current gate: Twitch seven-day accumulation audit')
roadmap = replaceOnce(roadmap, 'The Kick permanent implementation and dormant release package are accepted. Kick runtime remains inactive until a separate exact one-file trigger is merged with the accepted PR #641 merge identity and a bounded start time.', 'Kick permanent category capture is accepted and active on the existing five-minute collector. Final evidence recorded 298 category-bearing snapshots, zero provider leakage, fresh authenticated data, safe storage headroom, and no rollback.')
roadmap = replaceOnce(roadmap, '1. Create a separate exact one-file trigger using accepted release-package merge `7afb81bb9098104107860e9fe6c920c7380964ad` and a start time no more than three hours ahead.\n2. Run a fresh read-only production preflight immediately before publish.\n3. Publish only the accepted Kick permanent config.\n4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.\n5. Observe for at least 24 hours, extending to 48 hours on warning.\n6. Final acceptance or verified rollback and temporary-path retirement.', '1. Final acceptance: PR #648.\n2. Final observation: run `30193672205`, job `89771280558`, artifact `8629415129`.\n3. Kick permanent capture remains active; the temporary hourly observation workflow is retired.\n4. No Kick category UI is authorized by this acceptance.')
roadmap = replaceOnce(roadmap, '1. Kick exact release, initial verification, observation, and acceptance or rollback.\n2. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.\n3. 12A-5C public Twitch Heatmap category-filter cutover.\n4. Kick category UI only after separate Kick acceptance and Kick stable accumulation evidence.\n5. Provider-specific Day Flow category views, then category history.', '1. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.\n2. 12A-5C public Twitch Heatmap category-filter cutover.\n3. Kick category UI only after separate Kick stable-accumulation and UI authorization evidence.\n4. Provider-specific Day Flow category views, then category history.')
roadmap = replaceOnce(roadmap, '- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`', '- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`\n- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`')
write(roadmapPath, roadmap)

const schedulePath = 'docs/product/current-schedule.md'
let schedule = read(schedulePath)
schedule = replaceOnce(schedule, 'Last updated: 2026-07-25', 'Last updated: 2026-07-26')
schedule = replaceOnce(schedule, 'Canonical target 12A-4-24 exact Kick release and Twitch seven-day audit', 'Canonical target 12A-4-24 Kick accepted; Twitch seven-day audit next')
schedule = replaceOnce(schedule, 'Kick permanent runtime active no', 'Kick permanent runtime active yes')
schedule = replaceOnce(schedule, '5. Release package canonical acceptance frozen in PR #642 without production publish or remote D1 mutation.', '5. Release package canonical acceptance frozen in PR #642 without production publish or remote D1 mutation.\n6. Exact release trigger PR #643 started production capture at `2026-07-25T07:10:00Z`.\n7. Initial two category-bearing snapshots passed; PR #645 froze start evidence and began guarded observation.\n8. Post-minimum run `30193672205` passed all gates with 298 category snapshots, zero leakage, and no rollback.\n9. Final acceptance is frozen in PR #648 and the temporary hourly monitor is retired.')
schedule = replaceOnce(schedule, '1. Create an exact one-file trigger on main using accepted release merge `7afb81bb9098104107860e9fe6c920c7380964ad` and a start boundary no more than three hours ahead.\n2. Re-run the fresh read-only Kick production preflight immediately before deployment.\n3. Publish only `workers/collector-kick/wrangler.category-permanent.toml`.\n4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.\n5. Observe for at least 24 hours.\n6. Extend to 48 hours on warning; restore normal Kick configuration immediately on a hard stop.\n7. Freeze final evidence, accept or roll back Kick, and retire all temporary paths.', '1. Track complete: Kick permanent category capture is accepted and active.\n2. Preserve the existing five-minute cadence and provider separation.\n3. Do not add Kick category UI without separate stable-accumulation and UI authorization evidence.')
write(schedulePath, schedule)

const wipPath = 'docs/work-in-progress/phase12a4-category-parallel-execution.md'
let wip = read(wipPath)
wip = replaceOnce(wip, 'Twitch permanent category capture is accepted and active. Both next-stage packages are now accepted canonically in PR #642:', 'Twitch and Kick permanent category capture are accepted and active. The hidden Twitch controls remain accepted but non-public:')
wip = replaceOnce(wip, '- Track A: Kick dormant permanent-category release package from PR #641 is accepted; the separate exact one-file release trigger is next under Issue #634.', '- Track A: Kick permanent category capture completed release, initial verification, minimum 24-hour observation, and final acceptance in PR #648; the temporary hourly monitor is retired.')
wip = replaceOnce(wip, '- Kick production runtime active: no.', '- Kick production runtime active: yes.\n- Final acceptance PR: #648.\n- Final observation run/job/artifact: `30193672205` / `89771280558` / `8629415129`.\n- Final category-bearing snapshots: 298.\n- Final provider leakage: 0.\n- Warning extension required: no.\n- Rollback required: no.')
wip = replaceOnce(wip, '1. Create a separate exact one-file trigger using accepted merge `7afb81bb9098104107860e9fe6c920c7380964ad` and a start time no more than three hours ahead.\n2. Re-run the fresh read-only preflight immediately before publish.\n3. Publish only the accepted Kick permanent config.\n4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.\n5. Observe for at least 24 hours, extend to 48 hours on warning, or roll back on a hard stop.\n6. Freeze final evidence and retire temporary paths.', '1. Track complete. Keep Kick permanent capture active on the existing five-minute collector.\n2. Preserve provider separation and the normal config as an available rollback target.\n3. Kick category UI remains unauthorized until separate Kick stable-accumulation and UI evidence is accepted.')
wip = replaceOnce(wip, '- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`', '- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`\n- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`')
write(wipPath, wip)

const verifierPath = 'scripts/verify-category-rollout-policy.mjs'
let verifier = read(verifierPath)
verifier = replaceOnce(verifier, "  kickRelease: 'docs/audits/12a4-kick-permanent-category-release-contract.json',", "  kickRelease: 'docs/audits/12a4-kick-permanent-category-release-contract.json',\n  kickObservation: 'docs/audits/12a4-kick-permanent-category-observation-contract.json',\n  kickFinalAcceptance: 'docs/audits/12a4-kick-permanent-category-final-acceptance.json',")
verifier = replaceOnce(verifier, 'const kickRelease = json(files.kickRelease)', 'const kickRelease = json(files.kickRelease)\nconst kickObservation = json(files.kickObservation)\nconst kickFinalAcceptance = json(files.kickFinalAcceptance)')
verifier = replaceOnce(verifier, "  'Hidden Twitch Heatmap category controls accepted from PR #640',", "  'Hidden Twitch Heatmap category controls accepted from PR #640',\n  'Kick permanent category capture started through PR #643',")
verifier = replaceOnce(verifier, "  'Canonical target 12A-4-24 exact Kick release and Twitch seven-day audit',", "  'Canonical target 12A-4-24 Kick accepted; Twitch seven-day audit next',\n  'Kick permanent runtime active yes',")
verifier = replaceOnce(verifier, "  'Dormant release package PR: #641.',", "  'Dormant release package PR: #641.',\n  'Final acceptance PR: #648.',")
verifier = replaceOnce(verifier, "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v31')")
verifier = replaceOnce(verifier, "assert.equal(gate.status, '12a4_release_and_hidden_controls_packages_accepted')", "assert.equal(gate.status, '12a4_kick_permanent_category_capture_accepted')")
verifier = replaceOnce(verifier, 'assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)', 'assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)')
verifier = replaceOnce(verifier, 'assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, false)', 'assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, true)')
verifier = replaceOnce(verifier, "assert.deepEqual(gate.openBlockers, [\n  'kick_permanent_category_capture_not_deployed',\n  'kick_permanent_category_capture_observation_not_accepted',\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])", "assert.deepEqual(gate.openBlockers, [\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])")
verifier = replaceOnce(verifier, 'assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, false)', 'assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, true)')
verifier = replaceOnce(verifier, 'assert.equal(gate.categoryParallelPackageAcceptance.kick.runtimeActive, false)', 'assert.equal(gate.categoryParallelPackageAcceptance.kick.runtimeActive, true)')
verifier = replaceOnce(verifier, "assert.equal(kickDecision.status, 'accepted_for_guarded_implementation')", "assert.equal(kickDecision.status, 'accepted_and_active')")
verifier = replaceOnce(verifier, 'assert.equal(kickDecision.decision.runtimeActive, false)', 'assert.equal(kickDecision.decision.runtimeActive, true)')
verifier = replaceOnce(verifier, "assert.equal(kickRelease.acceptance.productionWorkerPublished, false)", "assert.equal(kickRelease.acceptance.productionWorkerPublished, false)\nassert.equal(kickObservation.status, 'accepted_and_retired')\nassert.equal(kickObservation.monitor.temporaryGitHubSchedule, false)\nassert.equal(kickFinalAcceptance.status, 'accepted')\nassert.equal(kickFinalAcceptance.minimumReached, true)\nassert.equal(kickFinalAcceptance.data.observedCategoryRows, 298)\nassert.equal(kickFinalAcceptance.data.providerLeakageRows, 0)\nassert.equal(kickFinalAcceptance.warningExtensionRequired, false)\nassert.equal(kickFinalAcceptance.rollbackRequired, false)")
verifier = replaceOnce(verifier, 'for (const path of [files.kickDecision, files.kickPackage, files.kickRelease, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.hiddenTwitchControls, files.activeWip])', 'for (const path of [files.kickDecision, files.kickPackage, files.kickRelease, files.kickObservation, files.kickFinalAcceptance, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.hiddenTwitchControls, files.activeWip])')
verifier = replaceOnce(verifier, '  kickRuntimeActive: false,', '  kickRuntimeActive: true,')
verifier = replaceOnce(verifier, "  nextAction: 'kick-exact-release-and-twitch-seven-day-audit',", "  nextAction: 'twitch-seven-day-audit',")
write(verifierPath, verifier)

console.log(JSON.stringify({ ok: true, acceptancePr, finalPath, gateSchema: gate.schemaVersion }, null, 2))
