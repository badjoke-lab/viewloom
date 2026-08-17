import fs from 'node:fs'

const acceptancePath = 'docs/audits/12a32-kick-history-disabled-runtime-production-deployment-acceptance.json'
const configPath = 'workers/collector-kick/wrangler.category-permanent.toml'
const entryPath = 'workers/collector-kick/src/entry.ts'
const passPath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'

const acceptance = JSON.parse(fs.readFileSync(acceptancePath, 'utf8'))
const config = fs.readFileSync(configPath, 'utf8')
const entry = fs.readFileSync(entryPath, 'utf8')
const costPass = JSON.parse(fs.readFileSync(passPath, 'utf8'))

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

expect(acceptance.phase === '12A-32', 'phase')
expect(acceptance.status === 'production_deployment_pass_generator_still_disabled', 'status')
expect(acceptance.provider === 'kick', 'provider')
expect(acceptance.trackingIssue === 904, 'tracking issue')
expect(acceptance.executionIssue === 903, 'execution issue')

expect(acceptance.candidate.pr === 898, 'candidate PR')
expect(acceptance.candidate.headSha === '6b4e95da258476ba104e4e3598ae5793f9153dcd', 'candidate head')
expect(acceptance.candidate.merged === true, 'candidate merged')
expect(acceptance.candidate.productionMainSha === 'acdb274ee03887d3247fb9498acda85fabfebcd5', 'production main SHA')
expect(acceptance.candidate.changedFiles === 4, 'candidate changed files')

expect(acceptance.decisionAuthority.issue === 901, 'decision issue')
expect(acceptance.decisionAuthority.pr === 902, 'decision PR')
expect(acceptance.decisionAuthority.decisionHeadSha === '95542a624fabf0b88a6abdceec9c4a3510a44670', 'decision head')
expect(acceptance.decisionAuthority.decisionMergeSha === '49a54557940968b9b13c0f74c72a59d90994b6c9', 'decision merge')

const deploy = acceptance.deployment
expect(deploy.workflow === 'Deploy Collector Workers', 'deployment workflow')
expect(deploy.runId === 32029471351, 'deployment run')
expect(deploy.runConclusion === 'success', 'deployment run conclusion')
expect(deploy.verifyJobId === 95385985029 && deploy.verifyResult === 'success', 'verify job')
expect(deploy.planJobId === 95386043376 && deploy.planResult === 'success', 'plan job')
expect(deploy.deployKickJobId === 95386092161 && deploy.deployKickResult === 'success', 'Kick deploy job')
expect(deploy.deployTwitchJobId === 95386093460 && deploy.deployTwitchResult === 'skipped', 'Twitch deploy job')
expect(deploy.remoteSchemaJobId === 95386158294 && deploy.remoteSchemaResult === 'success', 'remote schema job')
expect(deploy.deployKick === true && deploy.deployTwitch === false && deploy.providerScoped === true, 'provider scoped deployment')
expect(deploy.canonicalKickConfig === configPath, 'canonical Kick config')
expect(deploy.workerName === 'viewloom-collector-kick', 'worker name')
expect(deploy.workerVersionId === '3f37e4dc-e888-4b88-8706-c5ef8d5b676a', 'worker version')
expect(deploy.schedule === '*/5 * * * *', 'schedule')

expect(config.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'existing intraday generation binding')
expect(config.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'existing category capture binding')
expect(config.includes('crons = ["*/5 * * * *"]'), 'existing cron')
expect(!config.includes('HISTORY_CATEGORY_GENERATION_ENABLED'), 'History generator must not be configured')
expect(!config.includes('HISTORY_CATEGORY_START_DAY'), 'History start day must not be configured')
expect(entry.includes('HISTORY_CATEGORY_GENERATION_ENABLED?: string'), 'candidate enable env support')
expect(entry.includes('HISTORY_CATEGORY_START_DAY?: string'), 'candidate start day env support')
expect(entry.includes("env.HISTORY_CATEGORY_GENERATION_ENABLED === 'true'"), 'strict History enable check')

const bindings = acceptance.deployedBindings
expect(bindings.intradayGenerationEnabled === 'true', 'deployed intraday binding')
expect(bindings.categoryCaptureEnabled === 'true', 'deployed category capture binding')
expect(bindings.historyCategoryGenerationEnabledPresent === false, 'History enable binding absent')
expect(bindings.historyCategoryStartDayPresent === false, 'History start day absent')
expect(bindings.historyCategoryGeneratorEnabled === false, 'History generator disabled')

expect(acceptance.artifact.id === 9288336433, 'artifact id')
expect(acceptance.artifact.name === 'phase12a2-collector-worker-deploy', 'artifact name')
expect(acceptance.artifact.digest === 'sha256:8a70143ea598d7ac4d9920a3b367e8faa141b52f62079b6bc13026faa4b592cc', 'artifact digest')
expect(acceptance.artifact.sizeBytes === 867, 'artifact size')

const schema = acceptance.remoteSchemaEvidence
expect(schema.origin === 'https://www.viewloom.net', 'schema origin')
expect(schema.path === '/api/schema-audit', 'schema path')
expect(schema.mode === 'read-only-schema-probe' && schema.readOnly === true, 'schema read-only boundary')
expect(schema.kickSchemaComplete === true && schema.kickObservedObjectCount === 3 && schema.kickExpectedObjectCount === 3, 'Kick schema complete')
expect(schema.kickRowsRead === 31 && schema.kickRowsWritten === 0, 'Kick schema query cost')
expect(schema.twitchSchemaComplete === true && schema.twitchObservedObjectCount === 3 && schema.twitchExpectedObjectCount === 3, 'Twitch schema complete')
expect(schema.twitchRowsWritten === 0, 'Twitch schema read-only')
expect(schema.remoteSchemaGatePass === true, 'remote schema pass')
expect(schema.migrationApplyPerformedByProbe === false, 'no migration from probe')
expect(schema.backfillPerformedByProbe === false, 'no backfill from probe')
expect(schema.generationStartedByProbe === false, 'no generation from probe')

const live = acceptance.liveReadOnlyAcceptance
expect(live.method === 'GET', 'live health method')
expect(live.requiredHealthOk === true && live.requiredStatusOk === true, 'live health requirements')
expect(live.requiredProvider === 'kick', 'live provider')
expect(live.requiredStorage === 'DB_KICK_HOT', 'live health storage')
expect(live.performedByAcceptanceCi === true && live.mutatesProduction === false, 'live read-only acceptance')

const boundary = acceptance.boundaries
for (const [key, value] of Object.entries(boundary)) {
  expect(value === false, `boundary must remain false: ${key}`)
}
expect(acceptance.acceptance.deploymentPass === true, 'deployment pass')
expect(acceptance.acceptance.generatorStillDisabled === true, 'generator still disabled')
expect(acceptance.acceptance.safeToOpenIndependentGeneratorEnableDecision === true, 'next decision allowed')
expect(acceptance.acceptance.generatorEnableAuthorizedByThisAcceptance === false, 'generator enable not authorized')

expect(costPass.performanceDetermination === 'PASS', 'accepted production cost PASS')
expect(costPass.result?.cost?.rowsRead === 16117, 'accepted production rows_read')
expect(costPass.thresholds?.rowsReadMaximum === 250000, 'accepted production rows_read maximum')
expect(costPass.boundaries?.permanentGeneratorEnabled === false, 'cost PASS did not enable permanent generator')

console.log('12A-32 Kick History disabled runtime production deployment acceptance verification passed.')
console.log(`- production main: ${acceptance.candidate.productionMainSha}`)
console.log(`- deployment run: ${deploy.runId}`)
console.log(`- Kick deploy: ${deploy.deployKickResult}`)
console.log(`- Twitch deploy: ${deploy.deployTwitchResult}`)
console.log(`- History generator enabled: ${bindings.historyCategoryGeneratorEnabled}`)
