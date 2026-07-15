import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-category-capture-canary-package-contract.json')
const decision = json('docs/audits/12a4-category-capture-enablement-decision-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const wrapper = read('workers/collector-kick/src/entry-category-canary.ts')
const canaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const categoryCapture = read('workers/shared/category-capture.ts')
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-package.yml')
const wip = read('docs/work-in-progress/phase12a4-kick-category-capture-canary.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-package-v1')
assert.ok(['candidate', 'accepted'].includes(contract.status))
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedInputs.enablementDecisionPr, 561)
assert.equal(contract.acceptedInputs.enablementDecisionMergeSha, '02561cfbfd65d8de39eaff3256090915f96f65e3')
assert.equal(contract.provider, 'kick')
assert.deepEqual(contract.providerOrder, ['kick', 'twitch'])
assert.equal(contract.package.committedDisabled, true)
assert.equal(contract.package.productionExecutionFromPackagePr, false)
assert.equal(contract.package.exactTriggerRequired, true)
assert.equal(contract.package.separateAcceptancePrRequired, true)
assert.equal(contract.package.minimumObservationHours, 24)
assert.equal(contract.package.automaticExpiryRequired, true)
assert.equal(contract.package.automaticPermanentEnablement, false)
assert.equal(contract.package.automaticTwitchStart, false)
assert.equal(contract.activation.acceptedWindowHoursMin, 23)
assert.equal(contract.activation.acceptedWindowHoursMax, 25)
assert.equal(contract.activation.expiredOrInvalidWindowForcesDisabled, true)
assert.equal(contract.preflight.projectedNinetyDaySizeMbMax, 330)
assert.equal(contract.preflight.projectedProviderHeadroomMbMin, 100)
assert.equal(contract.hardStops.categoryGeneratorQueriesMax, 12)
assert.equal(contract.hardStops.collectorLatencyDeltaMsMax, 2000)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.hardStops.captureAfterExpiryAllowed, false)
assert.equal(contract.hardStops.persistentCaptureAfterRollbackAllowed, false)
assert.equal(contract.rollback.schemaRollbackRequired, false)
assert.equal(contract.rollback.captureDisabledAfterRollbackRequired, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(decision.status, 'accepted')
assert.deepEqual(decision.decision.sequencing, ['kick', 'twitch'])
assert.equal(decision.providers.kick.canaryPackageDesignAuthorized, true)
assert.equal(decision.providers.kick.productionCanaryExecutionAuthorizedByThisContract, false)
assert.equal(decision.decision.productionRuntimeCaptureAuthorized, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v16')
assert.equal(gate.currentWorkstream.phase, '12A-4-8')
assert.equal(gate.currentWorkstream.kickPackageDesignCurrent, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickEvidence, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)

for (const fragment of [
  "import collector from './entry'",
  "CATEGORY_CAPTURE_CANARY_ENABLED?: string",
  "CATEGORY_CAPTURE_CANARY_PROVIDER?: string",
  "CATEGORY_CAPTURE_CANARY_STARTED_AT?: string",
  "CATEGORY_CAPTURE_CANARY_UNTIL?: string",
  "CATEGORY_CAPTURE_CANARY_ATTEMPT?: string",
  "provider !== 'kick'",
  "mode: 'invalid_window'",
  "mode: 'expired'",
  "CATEGORY_CAPTURE_ENABLED: state.active ? 'true' : 'false'",
  "url.pathname === '/category-canary-status'",
  "event: 'kick_category_capture_canary_state'",
]) assert.ok(wrapper.includes(fragment), `canary wrapper missing ${fragment}`)
assert.ok(wrapper.includes('23 * 60 * 60 * 1000'))
assert.ok(wrapper.includes('25 * 60 * 60 * 1000'))

assert.ok(canaryConfig.includes('main = "src/entry-category-canary.ts"'))
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_PROVIDER = "kick"'))
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_STARTED_AT = ""'))
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_UNTIL = ""'))
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "0"'))
assert.equal(canaryConfig.includes('CATEGORY_CAPTURE_ENABLED ='), false)
assert.equal(normalConfig.includes('CATEGORY_CAPTURE_ENABLED ='), false)
assert.equal(normalConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED'), false)
assert.equal(canaryConfig.match(/database_id = "([^"]+)"/)?.[1], normalConfig.match(/database_id = "([^"]+)"/)?.[1])

assert.equal(categoryCapture.includes('WITH incoming AS'), false)
assert.equal(categoryCapture.includes('FROM json_each(?) AS j'), true)
assert.equal(categoryCapture.includes('.bind(provider, observedAt, observedAt, CATEGORY_CONTRACT_VERSION, JSON.stringify(entries))'), true)
assert.equal(contract.dictionarySqlRepair.legacyCteAllowed, false)
assert.equal(contract.dictionarySqlRepair.directInsertSelectFromJsonEachRequired, true)

assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.category-canary.toml'), true)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.toml'), true)
assert.equal(workflow.includes('verify-development-policy.mjs'), true)

for (const fragment of [
  'Status: candidate dormant package',
  'Kick first',
  'Twitch second only after accepted Kick canary evidence',
  'production category capture from this PR: forbidden',
  'window is between 23 and 25 hours',
  'minimum duration: 24 hours',
  'Twitch category capture begins',
  'This PR cannot start the canary',
]) assert.ok(wip.includes(fragment), `WIP missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: contract.provider,
  observationHours: contract.package.minimumObservationHours,
  committedDisabled: contract.package.committedDisabled,
  productionRuntimeCaptureAuthorized: false,
  twitchBlockedUntilKickEvidence: true,
}, null, 2))
