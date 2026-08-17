import fs from 'node:fs'

const audit = JSON.parse(fs.readFileSync('docs/audits/12a36-kick-history-generator-production-enable-deployment-verification.json', 'utf8'))
const config = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function expect(value, message) {
  if (!value) throw new Error(message)
}

expect(audit.schemaVersion === 'viewloom-12a36-kick-history-generator-production-enable-deployment-verification-v1', 'schema')
expect(audit.phase === '12A-36', 'phase')
expect(audit.status === 'deployment_verification_candidate', 'status')
expect(audit.provider === 'kick', 'provider')
expect(audit.executionIssue === 912, 'execution issue')
expect(audit.postEnableAcceptanceIssue === 913, 'acceptance issue')
expect(audit.executionUtcStartDay === '2026-08-17', 'startDay')

expect(audit.candidate.pr === 909, 'candidate PR')
expect(audit.candidate.exactTransformedHead === 'c05b6f3946984099d60545c1e357164d1047f2d7', 'candidate head')
expect(audit.candidate.productionMergeSha === '6a86db8ab202bbedcb33bef06890397ce5302245', 'production merge')
expect(audit.candidate.changedFiles === 4, 'candidate changed files')

expect(audit.deployment.run === 32040573449, 'deploy run')
expect(audit.deployment.verifyJob === 95419035625, 'verify job')
expect(audit.deployment.planJob === 95419119723, 'plan job')
expect(audit.deployment.deployKickJob === 95419137695, 'Kick job')
expect(audit.deployment.deployTwitchJob === 95419138595, 'Twitch job')
expect(audit.deployment.remoteSchemaJob === 95419179213, 'remote schema job')
expect(audit.deployment.artifactId === 9291879783, 'artifact id')
expect(audit.deployment.artifactDigest === 'sha256:fd8851c0d306efd5685e64719c08ea0e1d0fcf7aa1427c493c966bef80572ee7', 'artifact digest')
expect(audit.deployment.workerVersion === 'cd3dd287-17e0-4fac-bd92-58ac02f33379', 'worker version')
expect(audit.deployment.kickDeploySucceeded === true, 'Kick deploy')
expect(audit.deployment.twitchDeploySkipped === true, 'Twitch skip')
expect(audit.deployment.remoteSchemaSucceeded === true, 'remote schema')

expect(audit.activeConfig.historyCategoryGenerationEnabled === 'true', 'active History true')
expect(audit.activeConfig.historyCategoryStartDay === '2026-08-17', 'active startDay')
expect(audit.activeConfig.cron === '*/5 * * * *', 'cron')
expect(audit.activeConfig.intradayGenerationEnabled === 'true', 'intraday')
expect(audit.activeConfig.categoryCaptureEnabled === 'true', 'category capture')

expect(config.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'config intraday')
expect(config.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'config category capture')
expect(config.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'config History true')
expect(config.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'config startDay')
expect(config.includes('crons = ["*/5 * * * *"]'), 'config cron')
expect((config.match(/HISTORY_CATEGORY_GENERATION_ENABLED/g) ?? []).length === 1, 'single History enable')
expect((config.match(/HISTORY_CATEGORY_START_DAY/g) ?? []).length === 1, 'single startDay')

expect(audit.liveVerification.endpointOrigin === 'https://viewloom-collector-kick.badjoke-lab.workers.dev', 'origin')
expect(JSON.stringify(audit.liveVerification.methods) === JSON.stringify(['GET']), 'GET only')
expect(audit.liveVerification.healthPath === '/health', 'health path')
expect(audit.liveVerification.statusPath === '/status', 'status path')
expect(audit.liveVerification.mustPassInAcceptanceCi === true, 'live CI requirement')

expect(audit.costGuard.acceptedRun === 31987877725, 'cost run')
expect(audit.costGuard.rowsRead === 16117, 'rows_read')
expect(audit.costGuard.rowsReadMaximum === 250000, 'rows_read max')
expect(audit.costGuard.rowsRead <= audit.costGuard.rowsReadMaximum, 'cost guard')

for (const [key, value] of Object.entries(audit.boundaries)) {
  expect(value === false, `boundary must remain false: ${key}`)
}

expect(audit.closeout.executionMayCloseAfterDeploymentAndLiveHealthPass === true, 'execution close rule')
expect(audit.closeout.firstNaturalGenerationStillRequiredForIssue913 === true, 'first natural generation required')
expect(JSON.stringify(audit.closeout.firstNaturalGenerationMaintenanceWindowsUtc) === JSON.stringify(['00:20-00:24', '12:20-12:24']), 'maintenance windows')

console.log('12A-36 Kick History generator production deployment verification contract passed.')
console.log('- production merge: 6a86db8ab202bbedcb33bef06890397ce5302245')
console.log('- deployment run: 32040573449')
console.log('- worker version: cd3dd287-17e0-4fac-bd92-58ac02f33379')
console.log('- active History startDay: 2026-08-17')
