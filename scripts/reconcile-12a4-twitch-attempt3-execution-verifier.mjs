import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const write = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
const replaceExact = (source, before, after, label) => {
  assert.ok(source.includes(before), `${label}: source fragment missing`)
  return source.replace(before, after)
}

let source = read('scripts/verify-12a4-twitch-category-capture-canary-execution-package.mjs')
source = replaceExact(source,
  'const trigger = json(contract.workflow.triggerPath)\n',
  `const trigger = json(contract.workflow.triggerPath)\nconst startEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')\nconst checkpointEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')\n`,
  'evidence imports')
source = source.replace("assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v20')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')")
source = source.replace('assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)', 'assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)')
source = source.replace('assert.ok(Number.isSafeInteger(trigger.attempt) && trigger.attempt >= 2)', 'assert.equal(trigger.attempt, 3)')
source = replaceExact(source,
  'assert.equal(contract.acceptance.startOrderFixPendingPrAcceptance, true)',
  `assert.equal(contract.acceptance.startOrderFixPendingPrAcceptance, false)\nassert.equal(contract.acceptance.startOrderFixPr, 609)\nassert.equal(contract.acceptance.startOrderFixMergeSha, '759b752c78b8a1a60e1132814429ca49c024da3b')\nassert.equal(contract.acceptance.monitorParserFixPendingPrAcceptance, false)\nassert.equal(contract.acceptance.monitorParserFixPr, 613)\nassert.equal(contract.acceptance.monitorParserFixMergeSha, '0091b0613be716f36ae7b89a2b363109eb67c107')\nassert.equal(contract.runtimeState, 'active_initial_checkpoint_accepted')\nassert.equal(contract.attempt3ActiveCheckpoint.startWorkflowRunId, 29631153598)\nassert.equal(contract.attempt3ActiveCheckpoint.startWorkflowJobId, 88044862377)\nassert.equal(contract.attempt3ActiveCheckpoint.startArtifactId, 8425765411)\nassert.equal(contract.attempt3ActiveCheckpoint.checkpointWorkflowRunId, 29634222309)\nassert.equal(contract.attempt3ActiveCheckpoint.checkpointWorkflowJobId, 88053537252)\nassert.equal(contract.attempt3ActiveCheckpoint.checkpointArtifactId, 8426512098)\nassert.equal(contract.attempt3ActiveCheckpoint.boundedRuntimeCaptureActive, true)\nassert.equal(contract.attempt3ActiveCheckpoint.permanentRuntimeCaptureAuthorized, false)\nassert.equal(contract.attempt3ActiveCheckpoint.kickChanged, false)\nassert.equal(startEvidence.outcome, 'started')\nassert.equal(startEvidence.attempt, 3)\nassert.equal(checkpointEvidence.outcome, 'checkpoint_pass')\nassert.equal(checkpointEvidence.queryEvidence.providerLeakageRows, 0)\nassert.equal(checkpointEvidence.queryEvidence.categoryPayloadRows, 30)`,
  'accepted active checkpoint')
source = replaceExact(source,
  "assert.ok(note.includes('The next gate is an exact one-file attempt 2 trigger'))",
  "assert.ok(note.includes('Attempt 3 is active inside the bounded window'))\nassert.ok(note.includes('Workflow run: `29634222309`'))\nassert.ok(note.includes('Final acceptance requires normal-config rollback'))",
  'active WIP checks')
write('scripts/verify-12a4-twitch-category-capture-canary-execution-package.mjs', source)

console.log(JSON.stringify({ok: true, verifier: 'twitch-canary-execution-package', attempt: 3}, null, 2))
