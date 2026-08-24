import assert from 'node:assert/strict'
import fs from 'node:fs'

const requireTrigger = process.argv.includes('--require-trigger')
const workflowPath = '.github/workflows/twitch-stream-map-coverage-acquisition-execution.yml'
const contractPath = 'docs/audits/twitch-stream-map-coverage-acquisition-execution-contract.json'
const triggerPath = 'docs/audits/twitch-stream-map-coverage-acquisition-trigger.json'
const workerPath = 'tools/twitch-stream-map-coverage-expansion/worker.mjs'
const wranglerPath = 'tools/twitch-stream-map-coverage-expansion/wrangler.toml'

const workflow = fs.readFileSync(workflowPath, 'utf8')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const worker = fs.readFileSync(workerPath, 'utf8')
const wrangler = fs.readFileSync(wranglerPath, 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-twitch-stream-map-coverage-acquisition-execution-v0.1')
assert.equal(contract.provider, 'twitch')
assert.equal(contract.requestedTopN, 300)
assert.equal(contract.oneTime, true)
assert.equal(contract.automaticSchedule, false)
assert.equal(contract.productionDeployment, false)
assert.equal(contract.d1Writes, 0)
assert.equal(contract.maxTokenRequests, 1)
assert.equal(contract.maxStreamsRequests, 3)
assert.equal(contract.maxUsersRequests, 0)
assert.equal(contract.acceptedAcquisitionPackagePr, 1039)
assert.equal(contract.acceptedAcquisitionMergeSha, '6544a67f302100ef691edb1f49f9af2b176ccc3d')
assert.equal(contract.triggerPath, triggerPath)

assert.match(workflow, /push:\s*\n\s*branches: \[main\]/)
assert.match(workflow, /docs\/audits\/twitch-stream-map-coverage-acquisition-trigger\.json/)
assert.match(workflow, /wrangler@4 versions upload/)
assert.match(workflow, /--preview-alias/)
assert.match(workflow, /Capture one Top300 stable-identity artifact/)
assert.match(workflow, /Verify stable-ID Country coverage queue/)
assert.match(workflow, /Verify City live coverage semantics/)
assert.match(workflow, /Build Country unique review queue from same Top300 artifact/)
assert.match(workflow, /Measure City-capable live coverage from same Top300 artifact/)
assert.match(workflow, /country-coverage-queue\.json/)
assert.match(workflow, /city-live-coverage\.json/)
assert.match(workflow, /actions\/upload-artifact@v4/)
assert.match(workflow, /productionDeployment == false/)
assert.match(workflow, /d1Writes == 0/)
assert.match(workflow, /apiRequests\.streams == 3/)
assert.match(workflow, /apiRequests\.users == 0/)
assert.match(workflow, /calendarWeekControlsQueue == false/)
assert.match(workflow, /publicCityFieldsActivated == false/)
assert.match(workflow, /currentLocationActivated == false/)
assert.equal(/^  workflow_dispatch:/m.test(workflow), false)
assert.equal(/^  schedule:/m.test(workflow), false)
assert.equal(worker.includes('/helix/users'), false)
assert.equal(worker.includes('const MAX_PAGES = 3'), true)
assert.equal(worker.includes('const PAGE_SIZE = 100'), true)
assert.equal(/\[\[d1_databases\]\]/.test(wrangler), false)
assert.equal(/\bcrons\s*=/.test(wrangler), false)
assert.equal(/\[triggers\]/.test(wrangler), false)

if (requireTrigger) {
  assert.equal(fs.existsSync(triggerPath), true, 'one-time trigger file is required')
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  assert.equal(trigger.schemaVersion, 'viewloom-twitch-stream-map-coverage-acquisition-trigger-v0.1')
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
  assert.equal(trigger.confirmation, 'RUN_TWITCH_STREAM_MAP_TOP300_COVERAGE_ACQUISITION')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.rearm, false)
  assert.equal(trigger.provider, 'twitch')
  assert.equal(trigger.requestedTopN, 300)
  assert.equal(trigger.expectedAcquisitionMergeSha, contract.acceptedAcquisitionMergeSha)
  assert.match(String(trigger.expectedExecutionPackageMergeSha ?? ''), /^[0-9a-f]{40}$/)
}

console.log('Twitch Stream Map coverage acquisition execution verification passed')
