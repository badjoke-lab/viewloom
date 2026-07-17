import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(path.join(root, file))
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

const contract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const decision = json('docs/audits/12a4-category-capture-enablement-decision-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const kickEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const wrapper = read('workers/collector-twitch/src/entry-category-canary.ts')
const canaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')
const normalConfig = read('workers/collector-twitch/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-twitch-category-capture-canary-package.yml')
const note = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary.md')

check('contract schema', contract.schemaVersion === 'viewloom-12a4-twitch-category-capture-canary-package-v1', contract.schemaVersion)
check('accepted status', contract.status === 'accepted', contract.status)
check('tracking issue', contract.trackingIssue === 519, contract.trackingIssue)
check('provider Twitch', contract.provider === 'twitch', contract.provider)
check('provider order', JSON.stringify(contract.providerOrder) === JSON.stringify(['kick', 'twitch']), contract.providerOrder)
check('accepted Kick final merge', contract.acceptedInputs.kickFinalAcceptancePr === 589 && contract.acceptedInputs.kickFinalAcceptanceMergeSha === '012d995057f849231c41b2f95a2b97186c0af324', contract.acceptedInputs)
check('package remains committed disabled', contract.package.committedDisabled === true && contract.package.productionExecutionFromPackagePr === false, contract.package)
check('later gates remain separate', contract.package.exactTriggerRequired === true && contract.package.separateExecutionPackageRequired === true && contract.package.separateAcceptancePrRequired === true, contract.package)
check('24-hour bounded canary', contract.package.minimumObservationHours === 24 && contract.activation.acceptedWindowHoursMin === 23 && contract.activation.acceptedWindowHoursMax === 25, { package: contract.package, activation: contract.activation })
check('automatic expiry without permanent enablement', contract.package.automaticExpiryRequired === true && contract.package.automaticPermanentEnablement === false && contract.activation.expiredOrInvalidWindowForcesDisabled === true, { package: contract.package, activation: contract.activation })
check('Twitch storage preflight thresholds', contract.preflight.projectedNinetyDaySizeMbMax === 440 && contract.preflight.projectedProviderHeadroomMbMin === 10 && contract.preflight.projectedAccountWideHeadroomMbMin === 500, contract.preflight)
check('current remote size deferred to execution', contract.preflight.currentRemoteD1SizeRequiredBeforeExecution === true && contract.preflight.ninetyDayProjectionRecalculationRequiredBeforeExecution === true, contract.preflight)
check('hard stops', contract.hardStops.categoryGeneratorQueriesMax === 12 && contract.hardStops.collectorLatencyDeltaMsMax === 2000 && contract.hardStops.providerLeakageRowsMax === 0 && contract.hardStops.captureAfterExpiryAllowed === false && contract.hardStops.persistentCaptureAfterRollbackAllowed === false, contract.hardStops)
check('rollback disables without schema rollback', contract.rollback.schemaRollbackRequired === false && contract.rollback.captureDisabledAfterRollbackRequired === true && contract.rollback.normalCollectionContinues === true, contract.rollback)
check('PR boundary all false', Object.values(contract.pullRequestBoundary).every((value) => value === false), contract.pullRequestBoundary)

check('accepted enablement decision', decision.status === 'accepted' && JSON.stringify(decision.decision.sequencing) === JSON.stringify(['kick', 'twitch']), decision.decision)
check('Twitch design only authorized', decision.providers.twitch.canaryPackageDesignAuthorized === true && decision.providers.twitch.productionCanaryExecutionAuthorizedByThisContract === false, decision.providers.twitch)
check('decision storage thresholds preserved', decision.providers.twitch.acceptedStorageProjectionMb === 438.7 && decision.providers.twitch.acceptedStorageHeadroomMb === 11.3, decision.providers.twitch)

check('canonical v19', gate.schemaVersion === 'viewloom-12a2-current-gate-state-v19' && gate.currentWorkstream.phase === '12A-4-12', { schemaVersion: gate.schemaVersion, phase: gate.currentWorkstream.phase })
check('Kick final evidence accepted', gate.currentWorkstream.acceptedKickCanaryFinalEvidence === true && gate.categoryCapture.kickCanaryFinalAcceptanceAccepted === true && gate.categoryCapture.kickCanaryRollbackVerified === true, gate.currentWorkstream)
check('Twitch remains unstarted', gate.categoryCapture.runtimeCaptureAuthorized === false && gate.categoryCapture.runtimeCaptureStarted === false && gate.categoryCapture.twitchCanaryAutomaticallyAuthorized === false, gate.categoryCapture)
check('Kick artifact accepted', kickEvidence.outcome === 'accepted' && kickEvidence.artifact.artifactId === 8399137444 && kickEvidence.gates.canaryBindingsAbsent === true, kickEvidence)
check('no Twitch trigger exists', !exists('docs/audits/12a4-twitch-category-capture-canary-trigger.json'))

for (const fragment of [
  "import collector from './entry'",
  'CATEGORY_CAPTURE_CANARY_ENABLED?: string',
  'CATEGORY_CAPTURE_CANARY_PROVIDER?: string',
  'CATEGORY_CAPTURE_CANARY_STARTED_AT?: string',
  'CATEGORY_CAPTURE_CANARY_UNTIL?: string',
  'CATEGORY_CAPTURE_CANARY_ATTEMPT?: string',
  "provider !== 'twitch'",
  "mode: 'invalid_window'",
  "mode: 'expired'",
  "CATEGORY_CAPTURE_ENABLED: state.active ? 'true' : 'false'",
  "url.pathname === '/category-canary-status'",
]) check(`wrapper contains ${fragment}`, wrapper.includes(fragment))

check('canary entry configured', canaryConfig.includes('main = "src/entry-category-canary.ts"'))
check('committed canary disabled', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
check('committed provider Twitch', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_PROVIDER = "twitch"'))
check('committed window empty', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_STARTED_AT = ""') && canaryConfig.includes('CATEGORY_CAPTURE_CANARY_UNTIL = ""'))
check('committed attempt invalid', canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "0"'))
check('no direct category flag in either config', !canaryConfig.includes('\nCATEGORY_CAPTURE_ENABLED =') && !normalConfig.includes('\nCATEGORY_CAPTURE_ENABLED ='))
check('normal config has no canary controls', !normalConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED'))
check('normal cadence unchanged', normalConfig.includes('crons = ["*/5 * * * *"]') && canaryConfig.includes('crons = ["*/5 * * * *"]'))
const canaryDatabaseId = activeTomlValue(canaryConfig, 'database_id')
const normalDatabaseId = activeTomlValue(normalConfig, 'database_id')
check('same Twitch D1 identity', Boolean(canaryDatabaseId) && canaryDatabaseId === normalDatabaseId, { canary: canaryDatabaseId, normal: normalDatabaseId })
check('same Twitch service identity', activeTomlValue(canaryConfig, 'name') === activeTomlValue(normalConfig, 'name'), { canary: activeTomlValue(canaryConfig, 'name'), normal: activeTomlValue(normalConfig, 'name') })

check('workflow PR/manual only', /^\s*pull_request:/m.test(workflow) && /^\s*workflow_dispatch:/m.test(workflow) && !/^\s*push:/m.test(workflow) && !/^\s*schedule:/m.test(workflow))
check('workflow has no Cloudflare secrets', !workflow.includes('CLOUDFLARE_API_TOKEN') && !workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
check('workflow dry-runs both Twitch configs', workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.toml') && workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.category-canary.toml'))
check('workflow includes typecheck and policy', workflow.includes('pnpm typecheck:collectors') && workflow.includes('verify-development-policy.mjs'))
check('working note accepted but execution unauthorized', note.includes('Accepted dormant package. Production execution is not authorized.'))
check('working note records accepted CI', note.includes('workflow run `29575999254`, job `87870458377`'))
check('working note preserves storage thresholds', note.includes('`440 MB`') && note.includes('`10 MB`') && note.includes('`500 MB`'))

check('accepted PR identity', contract.acceptance.pr === 590 && contract.acceptance.validatedCandidateHeadSha === '685c813d5d1a0f3fd36e0d85072d791da3a30f41', contract.acceptance)
check('accepted CI identity', contract.acceptance.packageWorkflowRunId === 29575999254 && contract.acceptance.packageWorkflowJobId === 87870458377, contract.acceptance)
check('all acceptance gates pass', contract.acceptance.packageScopePass === true && contract.acceptance.canaryFixturePass === true && contract.acceptance.collectorTypecheckPass === true && contract.acceptance.developmentPolicyPass === true && contract.acceptance.normalTwitchBundlePass === true && contract.acceptance.disabledCanaryBundlePass === true, contract.acceptance)
check('acceptance performed no production work', contract.acceptance.productionRuntimeCaptureStarted === false && contract.acceptance.productionWorkerDeployed === false && contract.acceptance.remoteD1OperationPerformed === false && contract.acceptance.kickChanged === false, contract.acceptance)

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: contract.provider,
  acceptancePr: contract.acceptance.pr,
  validatedCandidateHeadSha: contract.acceptance.validatedCandidateHeadSha,
  packageWorkflowRunId: contract.acceptance.packageWorkflowRunId,
  observationHours: contract.package.minimumObservationHours,
  committedDisabled: contract.package.committedDisabled,
  twitchDatabaseId: canaryDatabaseId,
  currentRemoteSizeRequiredBeforeExecution: true,
  productionRuntimeCaptureAuthorized: false,
  triggerPresent: false,
}, null, 2))
