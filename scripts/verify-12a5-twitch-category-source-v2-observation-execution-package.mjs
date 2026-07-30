import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json',
  triggerContract: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json',
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  acceptedPackage: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  acceptedPackageAcceptance: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json',
  decision: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  generator: 'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  runner: 'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  config: 'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
  rollbackConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  workflow: '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  normalDeployWorkflow: '.github/workflows/deploy-collector-workers.yml',
  twitchCollector: 'workers/collector-twitch/src/index-category.ts',
  kickCollector: 'workers/collector-kick/src/index-category.ts',
}
for (const [key, file] of Object.entries(files)) {
  if (key === 'trigger') continue
  assert.equal(existsSync(file), true, `${file}: missing`)
}
assert.equal(existsSync(files.trigger), false, `${files.trigger}: exact trigger must be absent on package PR`)

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json(files.contract)
const triggerContract = json(files.triggerContract)
const acceptedPackage = json(files.acceptedPackage)
const acceptedAcceptance = json(files.acceptedPackageAcceptance)
const decision = json(files.decision)
const generator = read(files.generator)
const runner = read(files.runner)
const config = read(files.config)
const rollbackConfig = read(files.rollbackConfig)
const workflow = read(files.workflow)
const normalDeployWorkflow = read(files.normalDeployWorkflow)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-execution-package-v1')
assert.equal(contract.status, 'candidate_ready_for_validation')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.packageIdentity.packagePr, 685)
assert.equal(contract.packageIdentity.productionExecutionPerformed, false)
assert.equal(contract.governingMainSha, '03426af2e678400baa04848d745768ccfbded738')
assert.equal(contract.acceptedCandidate.packagePr, 682)
assert.equal(contract.acceptedCandidate.packageMergeSha, '2ae91cbf6b07616dcadc60894a832ace089c39fa')
assert.equal(contract.acceptedCandidate.acceptancePr, 684)
assert.equal(acceptedPackage.status, 'accepted')
assert.equal(acceptedPackage.packageIdentity.packagePr, contract.acceptedCandidate.packagePr)
assert.equal(acceptedPackage.packageIdentity.acceptancePr, contract.acceptedCandidate.acceptancePr)
assert.equal(acceptedAcceptance.status, 'accepted')
assert.equal(decision.status, 'recovery_required')

assert.equal(contract.sourceIdentity.activeCategoryCollectorBlob, '2b3bd54b92e26f802c05048160ed293b0b4e9d43')
assert.equal(contract.sourceIdentity.activeEntryBlob, '26be160414bfe38ebf8ce61660f8478b570454b6')
assert.equal(contract.sourceIdentity.acceptedCandidateBlob, '57df5b3e12a27587a6345a3bf2a6155d3dd669e5')
assert.equal(contract.sourceIdentity.activeFilesModifiedByGenerator, false)
assert.equal(contract.deploymentBoundary.workerName, 'viewloom-collector-twitch')
assert.equal(contract.deploymentBoundary.cron, '*/5 * * * *')
assert.equal(contract.deploymentBoundary.newCronAdded, false)
assert.equal(contract.deploymentBoundary.kickChanged, false)
assert.equal(contract.deploymentBoundary.canonicalRollbackRequired, true)
assert.equal(contract.deploymentBoundary.canonicalRollbackConfig, files.rollbackConfig)
assert.equal(contract.observationGate.requiredConsecutiveSnapshots, 2)
assert.equal(contract.observationGate.maximumObservationMinutes, 16)
assert.equal(contract.observationGate.pollIntervalSeconds, 30)
assert.equal(contract.observationGate.invalidRefsAllowed, 0)
assert.equal(contract.observationGate.unresolvedCategoryIdsAllowed, 0)
assert.equal(contract.startBoundary.executeImmediatelyAfterExactTriggerMerge, true)
assert.equal(contract.startBoundary.startAtFieldAllowed, false)
assert.equal(contract.startBoundary.preStartSleepAllowed, false)
assert.equal(contract.startBoundary.longInJobWaitAllowed, false)
assert.equal(contract.startBoundary.boundedObservationPollingAllowed, true)
assert.deepEqual(contract.directD1Boundary.statements, ['SELECT', 'WITH'])
assert.equal(Object.values(contract.directD1Boundary).slice(1).every((value) => value === false), true)
for (const value of Object.values(contract.packagePrBoundary)) assert.equal(value, false)

const envelope = contract.timeoutEnvelopeMinutes
const calculatedMaximum = envelope.setupAndGeneration + envelope.candidateDeploy + envelope.observation
  + envelope.canonicalRollback + envelope.artifactUpload + envelope.buffer
assert.equal(calculatedMaximum, envelope.requiredMaximum)
assert.equal(envelope.requiredMaximum, 44)
assert.equal(envelope.jobTimeout, 50)
assert.ok(envelope.jobTimeout > envelope.requiredMaximum)
assert.equal(envelope.jobTimeoutGreaterThanRequiredMaximum, true)

assert.equal(triggerContract.status, 'requires_execution_package_acceptance')
assert.equal(triggerContract.executionPackageIdentity.packagePr, 685)
assert.equal(triggerContract.executionPackageIdentity.packageMergeSha, null)
assert.equal(triggerContract.executionPackageIdentity.acceptancePr, null)
assert.equal(triggerContract.trigger.executeImmediately, true)
assert.equal(triggerContract.trigger.startAtAllowed, false)
assert.equal(triggerContract.trigger.exactOneFilePrRequired, true)
assert.equal(triggerContract.executionBoundary.canonicalRollbackRequired, true)
assert.equal(triggerContract.executionBoundary.maximumObservationMinutes, 16)
assert.equal(triggerContract.executionBoundary.jobTimeoutMinutes, 50)
assert.equal(triggerContract.executionBoundary.newCronAllowed, false)
assert.deepEqual(triggerContract.executionBoundary.directD1Statements, ['SELECT', 'WITH'])

for (const fragment of [
  "activeIndex: '2b3bd54b92e26f802c05048160ed293b0b4e9d43'",
  "activeEntry: '26be160414bfe38ebf8ce61660f8478b570454b6'",
  "candidate: '57df5b3e12a27587a6345a3bf2a6155d3dd669e5'",
  "CATEGORY_SOURCE_V2_OBSERVATION_ENABLED",
  "encodeCategorySourceCompletenessV2Candidate(input.items, input.hasMore)",
  "encodeCategorySnapshot(input.items, input.hasMore)",
  "activeSourceModified: false",
]) assert.ok(generator.includes(fragment), `generator missing: ${fragment}`)

for (const fragment of [
  "const MAX_OBSERVATION_MS = 16 * 60_000",
  "const POLL_INTERVAL_MS = 30_000",
  "runWranglerDeploy(CANDIDATE_CONFIG)",
  "runWranglerDeploy(ROLLBACK_CONFIG)",
  "finally",
  "two_consecutive_v2_snapshots_missing",
  "category-source-v2-candidate",
  "2bit-hex-v1",
  "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))",
  "throw new Error('non_select_statement_rejected')",
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)
for (const forbidden of ['START_AT', 'startAt', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE', 'wrangler d1 execute --command INSERT']) {
  assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
}

const value = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const dbId = (source) => source.match(/^database_id\s*=\s*"([^"]+)"$/m)?.[1] ?? null
assert.equal(value(config, 'name'), value(rollbackConfig, 'name'))
assert.equal(value(config, 'name'), 'viewloom-collector-twitch')
assert.equal(value(config, 'CATEGORY_CAPTURE_ENABLED'), 'true')
assert.equal(value(config, 'INTRADAY_GENERATION_ENABLED'), 'true')
assert.equal(value(config, 'CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), 'true')
assert.equal(cron(config), cron(rollbackConfig))
assert.equal(cron(config), '*/5 * * * *')
assert.equal(dbId(config), dbId(rollbackConfig))
assert.equal(config.includes('../../workers/collector-twitch/.generated-v2-observation/entry.ts'), true)
assert.equal(rollbackConfig.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)

assert.equal(normalDeployWorkflow.includes("'execution-packages/**'"), false)
assert.equal(normalDeployWorkflow.includes('build-12a5-twitch-category-source-v2-observation-worker.mjs'), false)
assert.equal(normalDeployWorkflow.includes('run-12a5-twitch-category-source-v2-observation.mjs'), false)
assert.equal(read(files.twitchCollector).includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(read(files.kickCollector).includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(read(files.kickCollector).includes('category-capture-v2-candidate'), false)

for (const fragment of [
  'name: Analytics 12A5 Twitch Category Source V2 Observation Execution',
  'timeout-minutes: 50',
  "github.event_name == 'push'",
  'needs.classify.outputs.trigger_present == \'true\'',
  'Run bounded Twitch category-source-v2 observation',
  'Upload Twitch category-source-v2 observation evidence',
  'Production observation skipped on package PR',
]) assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('Wait for exact'), false)
assert.equal(workflow.includes('START_AT'), false)

for (const [file, fragments] of Object.entries({
  'docs/product/current-roadmap.md': ['Twitch-only category-source-v2 execution package', 'work-659-twitch-category-source-v2-completeness-execution-package'],
  'docs/product/current-schedule.md': ['Current gate Twitch-only category-source-v2 execution package', 'Package accepted PR #682 / #684'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['Twitch-only category-source-v2 execution package', 'prohibit in-job long sleeps'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Twitch-only category-source-v2 execution package', 'Execution-package PR uses no production credentials or execution'],
  'AGENTS.md': ['Package accepted: PR #682 / #684', 'work-659-twitch-category-source-v2-completeness-execution-package'],
  'CONTRIBUTING.md': ['Package accepted PR #682 / #684', 'No production execution before a separately accepted execution package'],
})) {
  const source = read(file)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${file} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  packagePr: contract.packageIdentity.packagePr,
  jobTimeoutMinutes: envelope.jobTimeout,
  requiredMaximumMinutes: envelope.requiredMaximum,
  immediateStart: true,
  normalDeployWatched: false,
  productionExecution: false,
  nextGate: contract.nextGate,
}, null, 2))
