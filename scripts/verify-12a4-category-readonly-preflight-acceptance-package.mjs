import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-acceptance-contract.json'))
const evidence = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-evidence.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight-acceptance.yml')

const failures = []
const check = (condition, label) => {
  if (!condition) failures.push(label)
}

check(contract.schemaVersion === 'viewloom-12a4-category-readonly-preflight-acceptance-contract-v1', 'contract schemaVersion')
check(contract.status === 'accepted_on_main', 'contract accepted-on-main status')
check(contract.planningPr === 520, 'planning PR')
check(contract.packagePr === 521, 'package PR')
check(contract.initialTriggerPr === 522, 'initial trigger PR')
check(contract.gateFixPr === 524, 'gate fix PR')
check(contract.retryTriggerPr === 525, 'retry trigger PR')
check(contract.providerHealthFixPr === 526, 'provider health fix PR')
check(contract.triggerPr === 527, 'attempt 3 trigger PR')
check(contract.triggerMergeSha === '51796234db2b88bd5d4e3393cf0b2a97b4927c7b', 'attempt 3 trigger merge SHA')
check(contract.sourceWorkflowRunId === 29318733171, 'source workflow run ID')
check(contract.acceptanceWorkflowRunId === 29318857656, 'acceptance workflow run ID')
check(contract.acceptancePr === 523, 'acceptance PR')
check(contract.acceptanceMergeSha === '428154d16dc5b62c30ac6b7cdeb668f3e442a3b6', 'acceptance merge SHA')
check(contract.acceptedEvidenceFile === 'docs/audits/12a4-category-readonly-preflight-evidence.json', 'accepted evidence path')
check(contract.requiredEvidence.readOnlyPreflightPass === true, 'preflight pass required')
check(contract.requiredEvidence.rowsWrittenMax === 0, 'zero rows-written threshold')
check(contract.requiredEvidence.changesMax === 0, 'zero changes threshold')
check(contract.workflowRetirement.productionPushTriggerRemoved === true, 'production push trigger retired')
check(contract.workflowRetirement.productionDeploymentJobRemoved === true, 'production deployment job retired')
check(contract.workflowRetirement.artifactReacceptanceJobRemoved === true, 'artifact reacceptance job retired')
check(contract.workflowRetirement.verificationOnly === true, 'verification-only retirement')
check(Object.values(contract.boundaries).every((value) => value === false), 'all acceptance boundaries false')

check(evidence.schemaVersion === 'viewloom-12a4-category-readonly-preflight-evidence-v1', 'frozen evidence schemaVersion')
check(evidence.status === 'accepted', 'frozen evidence accepted status')
check(evidence.providerSeparated === true, 'frozen provider separation')
check(evidence.execution?.headSha === contract.triggerMergeSha, 'frozen evidence trigger SHA')
check(evidence.execution?.event === 'push', 'frozen evidence push event')
check(evidence.execution?.trigger?.attempt === 3, 'frozen evidence attempt 3')
check(evidence.gate?.twitchGatePass === true, 'Twitch gate pass')
check(evidence.gate?.kickGatePass === true, 'Kick gate pass')
check(evidence.gate?.readOnlyPreflightPass === true, 'read-only preflight pass')
check(evidence.gate?.remoteMigrationApplyAuthorized === false, 'remote migration unauthorized')
check(evidence.gate?.runtimeCaptureEnablementAuthorized === false, 'runtime capture unauthorized')
check(evidence.providers?.twitch?.health?.source === 'collector_status', 'Twitch health source')
check(evidence.providers?.kick?.health?.source === 'latest_snapshot', 'Kick health source')
check(evidence.providers?.twitch?.providerLeakageRows === 0, 'Twitch provider leakage zero')
check(evidence.providers?.kick?.providerLeakageRows === 0, 'Kick provider leakage zero')
check(evidence.providers?.twitch?.query?.rowsWritten === 0, 'Twitch rows written zero')
check(evidence.providers?.kick?.query?.rowsWritten === 0, 'Kick rows written zero')
check(evidence.providers?.twitch?.query?.changes === 0, 'Twitch changes zero')
check(evidence.providers?.kick?.query?.changes === 0, 'Kick changes zero')
check(evidence.providers?.twitch?.lifecycle?.deleteHttpStatus === 404, 'Twitch temporary Worker deleted')
check(evidence.providers?.kick?.lifecycle?.deleteHttpStatus === 404, 'Kick temporary Worker deleted')
check(evidence.acceptanceIdentity?.triggerPr === 527, 'frozen trigger PR')
check(evidence.acceptanceIdentity?.workflowRunId === contract.sourceWorkflowRunId, 'frozen source workflow run ID')
check(evidence.workflow?.runId === contract.sourceWorkflowRunId, 'frozen workflow run identity')
check(Object.values(evidence.privacy ?? {}).every((value) => value === false), 'frozen privacy exclusions')
check(Object.values(evidence.boundaries ?? {}).every((value) => value === false), 'frozen evidence boundaries false')

check(workflow.includes('Acceptance Retired'), 'retired acceptance workflow name')
check(!workflow.includes('production-acceptance:'), 'production acceptance job removed')
check(!workflow.includes('event=push'), 'source run lookup removed')
check(!workflow.includes('actions/artifacts/$artifact_id/zip'), 'artifact download removed')
check(!workflow.includes('GH_TOKEN'), 'GitHub run-fetch token removed')
check(!workflow.includes('CLOUDFLARE_API_TOKEN'), 'no Cloudflare API token')
check(!workflow.includes('wrangler deploy'), 'no Worker deployment')
check(!workflow.includes('wrangler d1 execute'), 'no D1 execute')
check(!workflow.includes('CATEGORY_CAPTURE_ENABLED'), 'no category enable flag')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  mode: 'accepted_on_main_and_retired',
  acceptancePr: contract.acceptancePr,
  acceptanceMergeSha: contract.acceptanceMergeSha,
  sourceWorkflowRunId: contract.sourceWorkflowRunId,
  twitchRowsRead: evidence.providers.twitch.query.rowsRead,
  kickRowsRead: evidence.providers.kick.query.rowsRead,
}, null, 2))
