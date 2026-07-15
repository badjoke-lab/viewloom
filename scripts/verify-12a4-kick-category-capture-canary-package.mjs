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
const wrapper = read('workers/collector-kick/src/entry-category-canary.ts')
const canaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const categoryCapture = read('workers/shared/category-capture.ts')
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-package.yml')
const wip = read('docs/work-in-progress/phase12a4-kick-category-capture-canary.md')

check('contract schema', contract.schemaVersion === 'viewloom-12a4-kick-category-capture-canary-package-v1', contract.schemaVersion)
check('contract accepted', contract.status === 'accepted', contract.status)
check('tracking issue', contract.trackingIssue === 519, contract.trackingIssue)
check('accepted decision identity', contract.acceptedInputs.enablementDecisionPr === 561 && contract.acceptedInputs.enablementDecisionMergeSha === '02561cfbfd65d8de39eaff3256090915f96f65e3', contract.acceptedInputs)
check('Kick-only provider order', contract.provider === 'kick' && JSON.stringify(contract.providerOrder) === JSON.stringify(['kick', 'twitch']), { provider: contract.provider, order: contract.providerOrder })
check('package remains dormant', contract.package.committedDisabled === true && contract.package.productionExecutionFromPackagePr === false, contract.package)
check('separate trigger and acceptance required', contract.package.exactTriggerRequired === true && contract.package.separateAcceptancePrRequired === true, contract.package)
check('24-hour bounded canary', contract.package.minimumObservationHours === 24 && contract.activation.acceptedWindowHoursMin === 23 && contract.activation.acceptedWindowHoursMax === 25, { package: contract.package, activation: contract.activation })
check('automatic expiry without permanent enablement', contract.package.automaticExpiryRequired === true && contract.package.automaticPermanentEnablement === false && contract.activation.expiredOrInvalidWindowForcesDisabled === true, { package: contract.package, activation: contract.activation })
check('Kick storage preflight thresholds', contract.preflight.projectedNinetyDaySizeMbMax === 330 && contract.preflight.projectedProviderHeadroomMbMin === 100, contract.preflight)
check('hard stops', contract.hardStops.categoryGeneratorQueriesMax === 12 && contract.hardStops.collectorLatencyDeltaMsMax === 2000 && contract.hardStops.providerLeakageRowsMax === 0 && contract.hardStops.captureAfterExpiryAllowed === false && contract.hardStops.persistentCaptureAfterRollbackAllowed === false, contract.hardStops)
check('rollback disables without schema rollback', contract.rollback.schemaRollbackRequired === false && contract.rollback.captureDisabledAfterRollbackRequired === true && contract.rollback.normalCollectionContinues === true, contract.rollback)
check('accepted candidate identity', contract.acceptance?.pr === 562 && contract.acceptance?.validatedCandidateHeadSha === 'a8255c5aadf3d46156503fc5668e18305f6ad7bf', contract.acceptance)
check('accepted package CI', contract.acceptance?.packageWorkflowRunId === 29386501622 && contract.acceptance?.packageWorkflowJobId === 87260809438 && contract.acceptance?.packageScopePass === true && contract.acceptance?.canaryFixturePass === true && contract.acceptance?.dictionaryFixturePass === true, contract.acceptance)
check('accepted compatibility CI', contract.acceptance?.migrationCompatibilityRunId === 29386501577 && contract.acceptance?.collectorChecksRunId === 29386501628 && contract.acceptance?.developmentPolicyRunId === 29386501646, contract.acceptance)
check('accepted bundles and deployment skip', contract.acceptance?.normalKickBundlePass === true && contract.acceptance?.disabledCanaryBundlePass === true && contract.acceptance?.deployTwitchSkipped === true && contract.acceptance?.deployKickSkipped === true && contract.acceptance?.remoteSchemaVerificationSkipped === true, contract.acceptance)
check('acceptance performed no production work', contract.acceptance?.productionRuntimeCaptureStarted === false && contract.acceptance?.productionWorkerDeployed === false && contract.acceptance?.remoteD1OperationPerformed === false && contract.acceptance?.twitchChanged === false, contract.acceptance)
check('PR boundary all false', Object.values(contract.pullRequestBoundary).every((value) => value === false), contract.pullRequestBoundary)

check('accepted decision', decision.status === 'accepted' && JSON.stringify(decision.decision.sequencing) === JSON.stringify(['kick', 'twitch']), { status: decision.status, sequence: decision.decision.sequencing })
check('Kick package design only', decision.providers.kick.canaryPackageDesignAuthorized === true && decision.providers.kick.productionCanaryExecutionAuthorizedByThisContract === false && decision.decision.productionRuntimeCaptureAuthorized === false, { kick: decision.providers.kick, decision: decision.decision })
check('v17 current gate', gate.schemaVersion === 'viewloom-12a2-current-gate-state-v17' && gate.currentWorkstream.phase === '12A-4-10', { schemaVersion: gate.schemaVersion, currentWorkstream: gate.currentWorkstream })
check('package and execution accepted', gate.currentWorkstream.acceptedKickCanaryPackage === true && gate.currentWorkstream.acceptedKickCanaryExecutionPackage === true, gate.currentWorkstream)
check('exact trigger current and Twitch blocked', gate.currentWorkstream.exactKickTriggerCurrent === true && gate.currentWorkstream.twitchPackageBlockedUntilKickEvidence === true, gate.currentWorkstream)
check('runtime remains disabled', gate.categoryCapture.runtimeCaptureAuthorized === false && gate.categoryCapture.categoryCaptureFlagPresent === false && gate.categoryCapture.productionCategoryRowsPresent === false && gate.categoryCapture.kickExactTriggerAccepted === false, gate.categoryCapture)

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
  "event: 'kick_category_capture_canary_state'",
  '23 * 60 * 60 * 1000',
  '25 * 60 * 60 * 1000',
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

check('legacy dictionary CTE removed', !categoryCapture.includes('WITH incoming AS'))
check('direct json_each insert present', categoryCapture.includes('FROM json_each(?) AS j'))
check('D1 binding order updated', categoryCapture.includes('.bind(provider, observedAt, observedAt, CATEGORY_CONTRACT_VERSION, JSON.stringify(entries))'))
check('dictionary repair contract', contract.dictionarySqlRepair.legacyCteAllowed === false && contract.dictionarySqlRepair.directInsertSelectFromJsonEachRequired === true, contract.dictionarySqlRepair)

check('workflow has no production event', !/^\s*push:/m.test(workflow) && !/^\s*schedule:/m.test(workflow))
check('workflow has no Cloudflare secrets', !workflow.includes('CLOUDFLARE_API_TOKEN') && !workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
check('workflow dry-runs both Kick configs', workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.category-canary.toml') && workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.toml'))
check('workflow includes policy gate', workflow.includes('verify-development-policy.mjs'))

for (const fragment of [
  'accepted dormant package',
  'Accepted package PR: #562',
  'Accepted execution package PR: #563',
  'Kick first',
  'accepted Kick canary evidence',
  'production category capture from package or execution PR: forbidden',
  'between 23 and 25 hours',
  'minimum duration: 24 hours',
  'Twitch category capture begins',
  '## Accepted handoff',
  'canonical gate is now 12A-4-10',
  'cannot start the canary by itself',
]) check(`WIP contains ${fragment}`, wip.includes(fragment))

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
  acceptedCandidateHeadSha: contract.acceptance.validatedCandidateHeadSha,
  currentPhase: gate.currentWorkstream.phase,
  productionRuntimeCaptureAuthorized: false,
  twitchBlockedUntilKickEvidence: true,
}, null, 2))
