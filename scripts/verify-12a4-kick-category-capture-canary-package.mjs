import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const failures = []
const check = (name, condition, actual = undefined) => {
  if (!condition) failures.push({ name, actual })
}
const activeTomlValue = (source, key) => source
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`)))
  .find(Boolean)?.[1]

const contract = json('docs/audits/12a4-kick-category-capture-canary-package-contract.json')
const decision = json('docs/audits/12a4-category-capture-enablement-decision-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const trigger = json('docs/audits/12a4-kick-category-capture-canary-trigger.json')
const finalEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const wrapper = read('workers/collector-kick/src/entry-category-canary.ts')
const canaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const categoryCapture = read('workers/shared/category-capture.ts')
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-package.yml')

check('contract schema', contract.schemaVersion === 'viewloom-12a4-kick-category-capture-canary-package-v1', contract.schemaVersion)
check('contract accepted', contract.status === 'accepted', contract.status)
check('tracking issue', contract.trackingIssue === 519, contract.trackingIssue)
check('accepted decision identity', contract.acceptedInputs.enablementDecisionPr === 561 && contract.acceptedInputs.enablementDecisionMergeSha === '02561cfbfd65d8de39eaff3256090915f96f65e3', contract.acceptedInputs)
check('Kick-only provider order', contract.provider === 'kick' && JSON.stringify(contract.providerOrder) === JSON.stringify(['kick', 'twitch']), { provider: contract.provider, order: contract.providerOrder })
check('package remains committed disabled', contract.package.committedDisabled === true && contract.package.productionExecutionFromPackagePr === false, contract.package)
check('separate trigger and acceptance required', contract.package.exactTriggerRequired === true && contract.package.separateAcceptancePrRequired === true, contract.package)
check('24-hour bounded canary', contract.package.minimumObservationHours === 24 && contract.activation.acceptedWindowHoursMin === 23 && contract.activation.acceptedWindowHoursMax === 25, { package: contract.package, activation: contract.activation })
check('automatic expiry without permanent enablement', contract.package.automaticExpiryRequired === true && contract.package.automaticPermanentEnablement === false && contract.activation.expiredOrInvalidWindowForcesDisabled === true, { package: contract.package, activation: contract.activation })
check('Kick storage preflight thresholds', contract.preflight.projectedNinetyDaySizeMbMax === 330 && contract.preflight.projectedProviderHeadroomMbMin === 100, contract.preflight)
check('hard stops', contract.hardStops.categoryGeneratorQueriesMax === 12 && contract.hardStops.collectorLatencyDeltaMsMax === 2000 && contract.hardStops.providerLeakageRowsMax === 0 && contract.hardStops.captureAfterExpiryAllowed === false && contract.hardStops.persistentCaptureAfterRollbackAllowed === false, contract.hardStops)
check('rollback disables without schema rollback', contract.rollback.schemaRollbackRequired === false && contract.rollback.captureDisabledAfterRollbackRequired === true && contract.rollback.normalCollectionContinues === true, contract.rollback)
check('accepted candidate identity', contract.acceptance?.pr === 562 && contract.acceptance?.validatedCandidateHeadSha === 'a8255c5aadf3d46156503fc5668e18305f6ad7bf', contract.acceptance)
check('acceptance performed no production work', contract.acceptance?.productionRuntimeCaptureStarted === false && contract.acceptance?.productionWorkerDeployed === false && contract.acceptance?.remoteD1OperationPerformed === false && contract.acceptance?.twitchChanged === false, contract.acceptance)
check('PR boundary all false', Object.values(contract.pullRequestBoundary).every((value) => value === false), contract.pullRequestBoundary)

check('accepted decision', decision.status === 'accepted' && JSON.stringify(decision.decision.sequencing) === JSON.stringify(['kick', 'twitch']), { status: decision.status, sequence: decision.decision.sequencing })
check('Kick package design only', decision.providers.kick.canaryPackageDesignAuthorized === true && decision.providers.kick.productionCanaryExecutionAuthorizedByThisContract === false && decision.decision.productionRuntimeCaptureAuthorized === false, { kick: decision.providers.kick, decision: decision.decision })

check('v19 current gate', gate.schemaVersion === 'viewloom-12a2-current-gate-state-v19' && gate.currentWorkstream.phase === '12A-4-12', { schemaVersion: gate.schemaVersion, currentWorkstream: gate.currentWorkstream })
check('package, execution, initial, and final evidence accepted', gate.currentWorkstream.acceptedKickCanaryPackage === true && gate.currentWorkstream.acceptedKickCanaryExecutionPackage === true && gate.currentWorkstream.acceptedKickCanaryInitialCheckpoint === true && gate.currentWorkstream.acceptedKickCanaryFinalEvidence === true, gate.currentWorkstream)
check('exact trigger retired and Twitch not automatic', gate.currentWorkstream.exactKickTriggerCurrent === false && gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized === false, gate.currentWorkstream)
check('bounded canary inactive without permanent enablement', gate.categoryCapture.runtimeCaptureAuthorized === false && gate.categoryCapture.runtimeCaptureStarted === false && gate.categoryCapture.categoryCaptureFlagPresent === false && gate.categoryCapture.kickCanaryObservationActive === false && gate.categoryCapture.boundedCanaryRuntimeCaptureActive === false && gate.categoryCapture.kickCanaryFinalAcceptanceAccepted === true && gate.categoryCapture.kickCanaryRollbackVerified === true, gate.categoryCapture)

check('trigger consumed and retired', trigger.status === 'consumed_and_retired' && trigger.oneTime === true && trigger.retired === true && trigger.attempt === 3 && trigger.finalArtifactId === 8399137444, trigger)
check('final evidence accepted', finalEvidence.outcome === 'accepted' && finalEvidence.gates.canaryBindingsAbsent === true && finalEvidence.gates.permanentDirectFlagAbsent === true && finalEvidence.gates.providerLeakagePass === true && finalEvidence.gates.twitchStartAuthorized === false, finalEvidence.gates)

for (const fragment of [
  "import collector from './entry'",
  'CATEGORY_CAPTURE_CANARY_ENABLED?: string',
  'CATEGORY_CAPTURE_CANARY_PROVIDER?: string',
  'CATEGORY_CAPTURE_CANARY_STARTED_AT?: string',
  'CATEGORY_CAPTURE_CANARY_UNTIL?: string',
  'CATEGORY_CAPTURE_CANARY_ATTEMPT?: string',
  "provider !== 'kick'",
  "mode: 'invalid_window'",
  "mode: 'expired'",
  "CATEGORY_CAPTURE_ENABLED: state.active ? 'true' : 'false'",
  "url.pathname === '/category-canary-status'",
]) check(`wrapper contains ${fragment}`, wrapper.includes(fragment))

check('canary entry configured', canaryConfig.includes('main = "src/entry-category-canary.ts"'))
check('committed canary disabled', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
check('committed provider is Kick', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_PROVIDER = "kick"'))
check('committed window empty', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_STARTED_AT = ""') && canaryConfig.includes('CATEGORY_CAPTURE_CANARY_UNTIL = ""'))
check('committed attempt invalid', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "0"'))
check('no direct category flag in either config', !canaryConfig.includes('\nCATEGORY_CAPTURE_ENABLED =') && !normalConfig.includes('\nCATEGORY_CAPTURE_ENABLED ='))
check('normal config has no canary controls', !normalConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED'))
const canaryDatabaseId = activeTomlValue(canaryConfig, 'database_id')
const normalDatabaseId = activeTomlValue(normalConfig, 'database_id')
check('same Kick D1 identity', Boolean(canaryDatabaseId) && canaryDatabaseId === normalDatabaseId, { canary: canaryDatabaseId, normal: normalDatabaseId })
check('D1-compatible dictionary insert', !categoryCapture.includes('WITH incoming AS') && categoryCapture.includes('FROM json_each(?) AS j'))

check('package workflow has no production event', !/^\s*push:/m.test(workflow) && !/^\s*schedule:/m.test(workflow))
check('package workflow has no Cloudflare secrets', !workflow.includes('CLOUDFLARE_API_TOKEN') && !workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
check('package workflow dry-runs both Kick configs', workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.category-canary.toml') && workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.toml'))
check('package workflow includes policy gate', workflow.includes('verify-development-policy.mjs'))

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: contract.provider,
  observationHours: contract.package.minimumObservationHours,
  committedDisabled: contract.package.committedDisabled,
  kickDatabaseId: canaryDatabaseId,
  currentPhase: gate.currentWorkstream.phase,
  finalArtifactId: trigger.finalArtifactId,
  boundedCanaryActive: false,
  permanentRuntimeCaptureAuthorized: false,
  twitchCanaryAutomaticallyAuthorized: false,
}, null, 2))
