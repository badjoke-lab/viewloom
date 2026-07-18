import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const write = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
const replaceExact = (source, before, after, label) => {
  assert.ok(source.includes(before), `${label}: source fragment missing`)
  return source.replace(before, after)
}

let verifier = read('scripts/verify-development-policy.mjs')
verifier = replaceExact(verifier,
  "  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json',",
  "  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json',\n  'docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json',\n  'docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json',",
  'required evidence')
verifier = replaceExact(verifier,
  "  'canonical gate 12A-4-15',\n  'Twitch read-only storage preflight accepted PR #599 and finalized PR #600',\n  'exact Twitch trigger current no',\n  'fresh Twitch storage evidence for start no',\n  'Twitch category capture started no',\n  'artifact: `8413901173`',",
  "  'canonical gate 12A-4-17',\n  'Twitch attempt 3 exact trigger accepted PR #614',\n  'exact Twitch trigger current yes',\n  'fresh Twitch start preflight accepted yes',\n  'Twitch bounded category capture active yes',\n  'artifact: 8426512098',",
  'docs index checks')
verifier = verifier.replace("'viewloom-12a2-current-gate-state-v20'", "'viewloom-12a2-current-gate-state-v21'")
verifier = verifier.replace("'12a4_twitch_canary_storage_preflight_accepted_trigger_blocked_by_freshness'", "'12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted'")
verifier = verifier.replace("assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.status, 'accepted_dormant')", "assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.status, 'accepted_active_bounded_canary')")
verifier = verifier.replace('assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.triggerPresent, false)', 'assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.triggerPresent, true)')
verifier = verifier.replace('assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.productionRuntimeCaptureStarted, false)', 'assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.productionRuntimeCaptureStarted, true)')
verifier = verifier.replace('assert.equal(gate.categoryCapture.twitchStoragePreflightFreshForStart, false)', 'assert.equal(gate.categoryCapture.twitchStoragePreflightFreshForStart, true)')
verifier = verifier.replace('assert.equal(gate.categoryCapture.twitchExactTriggerAccepted, false)', 'assert.equal(gate.categoryCapture.twitchExactTriggerAccepted, true)')
verifier = verifier.replace('assert.equal(gate.categoryCapture.twitchCanaryExecuted, false)', 'assert.equal(gate.categoryCapture.twitchCanaryExecuted, true)')
verifier = verifier.replace('assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, false)', 'assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, true)')
verifier = verifier.replace('assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)', 'assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)')
verifier = replaceExact(verifier,
  "assert.deepEqual(gate.openBlockers, [\n  'twitch_category_capture_storage_preflight_not_fresh_for_start',\n  'twitch_category_capture_exact_trigger_not_accepted',\n  'twitch_category_capture_canary_not_executed',\n  'runtime_category_capture_not_authorized',\n])",
  "assert.deepEqual(gate.openBlockers, [\n  'twitch_category_capture_final_observation_not_accepted',\n  'twitch_category_capture_canary_rollback_not_verified',\n  'runtime_category_capture_not_authorized',\n])",
  'open blockers')
verifier = verifier.replace("assert.equal(gate.currentWorkstream.phase, '12A-4-15')", "assert.equal(gate.currentWorkstream.phase, '12A-4-17')")
verifier = verifier.replace('assert.equal(gate.currentWorkstream.exactTwitchTriggerCurrent, false)', 'assert.equal(gate.currentWorkstream.exactTwitchTriggerCurrent, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, false)', 'assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.twitchStoragePreflightFreshForStart, false)', 'assert.equal(gate.currentWorkstream.twitchStoragePreflightFreshForStart, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)', 'assert.equal(gate.currentWorkstream.productionExecutionIncluded, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)', 'assert.equal(gate.currentWorkstream.runtimeCaptureStarted, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, false)', 'assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, true)')
verifier = verifier.replace('assert.equal(gate.currentWorkstream.finalRollbackPending, false)', 'assert.equal(gate.currentWorkstream.finalRollbackPending, true)')
verifier = replaceExact(verifier,
  'assert.equal(twitchEvidence.gates.runtimeCaptureStarted, false)\n',
  `assert.equal(twitchEvidence.gates.runtimeCaptureStarted, false)\n\nconst twitchStart = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')\nconst twitchCheckpoint = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')\nconst twitchAcceptance = gate.twitchCategoryCaptureCanaryInitialAcceptance\nassert.equal(twitchAcceptance.status, 'accepted_active_initial_checkpoint')\nassert.equal(twitchAcceptance.startWorkflowRunId, 29631153598)\nassert.equal(twitchAcceptance.startWorkflowJobId, 88044862377)\nassert.equal(twitchAcceptance.startArtifactId, 8425765411)\nassert.equal(twitchAcceptance.checkpointWorkflowRunId, 29634222309)\nassert.equal(twitchAcceptance.checkpointWorkflowJobId, 88053537252)\nassert.equal(twitchAcceptance.checkpointArtifactId, 8426512098)\nassert.equal(twitchAcceptance.providerLeakageRows, 0)\nassert.equal(twitchAcceptance.boundedCanaryActive, true)\nassert.equal(twitchAcceptance.permanentRuntimeCaptureAuthorized, false)\nassert.equal(twitchAcceptance.kickChanged, false)\nassert.equal(twitchStart.outcome, 'started')\nassert.equal(twitchStart.attempt, 3)\nassert.equal(twitchStart.serviceBindingsAfter.categoryCaptureDirectFlagPresent, false)\nassert.equal(twitchStart.gates.permanentEnablementAuthorized, false)\nassert.equal(twitchCheckpoint.outcome, 'checkpoint_pass')\nassert.equal(twitchCheckpoint.queryEvidence.providerLeakageRows, 0)\nassert.equal(twitchCheckpoint.queryEvidence.categoryPayloadRows, 30)\nassert.equal(twitchCheckpoint.gates.hardStop, false)\n`,
  'active evidence checks')
verifier = verifier.replace('  twitchStoragePreflightFreshForStart: false,', '  twitchStoragePreflightFreshForStart: true,')
verifier = verifier.replace('  exactTwitchTriggerCurrent: false,', '  exactTwitchTriggerCurrent: true,')
write('scripts/verify-development-policy.mjs', verifier)

let active = read('scripts/verify-development-policy-active-twitch-canary.mjs')
active = replaceExact(active,
  'const storagePreflight = json(executionContract.trigger.storagePreflightContract)\n',
  `const storagePreflight = json(executionContract.trigger.storagePreflightContract)\nconst gate = json('docs/audits/12a2-current-gate-state.json')\nconst startEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')\nconst checkpointEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')\n`,
  'active evidence imports')
active = replaceExact(active,
  'assert.equal(trigger.oneTime, true)\n',
  `assert.equal(trigger.oneTime, true)\nassert.equal(trigger.attempt, 3)\nassert.equal(trigger.startAt, '2026-07-18T05:15:00.000Z')\nassert.equal(trigger.until, '2026-07-19T05:15:00.000Z')\n`,
  'active attempt')
active = replaceExact(active,
  'assert.equal(/CATEGORY_CAPTURE_ENABLED\\s*=/.test(kickConfig), false)\n',
  `assert.equal(/CATEGORY_CAPTURE_ENABLED\\s*=/.test(kickConfig), false)\nassert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')\nassert.equal(gate.status, '12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted')\nassert.equal(gate.currentWorkstream.phase, '12A-4-17')\nassert.equal(gate.currentWorkstream.twitchCanaryObservationActive, true)\nassert.equal(gate.currentWorkstream.finalRollbackPending, true)\nassert.equal(gate.categoryCapture.runtimeCaptureStarted, true)\nassert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)\nassert.equal(executionContract.runtimeState, 'active_initial_checkpoint_accepted')\nassert.equal(startEvidence.outcome, 'started')\nassert.equal(checkpointEvidence.outcome, 'checkpoint_pass')\nassert.equal(checkpointEvidence.queryEvidence.providerLeakageRows, 0)\nassert.equal(checkpointEvidence.gates.permanentEnablementAuthorized, false)\nassert.equal(checkpointEvidence.gates.kickStartAuthorized, false)\n`,
  'active canonical evidence')
write('scripts/verify-development-policy-active-twitch-canary.mjs', active)

console.log(JSON.stringify({ok: true, verifiers: ['development-policy', 'active-twitch-canary']}, null, 2))
