import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const diagnosticsPath = path.join(root, 'artifacts/12a4-category-execution-cost-probe-acceptance/package-diagnostics.json')

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance.yml')

const checks = {
  contractSchema: contract.schemaVersion === 'viewloom-12a4-category-execution-cost-probe-acceptance-contract-v1',
  contractStatus: ['candidate', 'accepted'].includes(contract.status),
  trackingIssue: contract.trackingIssue === 519,
  triggerPr: contract.trigger.pr === 549,
  triggerHeadSha: contract.trigger.headSha === '7ef6a887d6bc4395ff3b0929add2fafaeff108b7',
  triggerMergeSha: contract.trigger.mergeSha === '9637f4927fbc5e4674e3a78e285d7ea6c5049cfa',
  triggerRunId: contract.trigger.runId === 'category-cost-probe-attempt-1',
  providerOrder: JSON.stringify(contract.trigger.providerOrder) === JSON.stringify(['twitch', 'kick']),
  sourceWorkflow: contract.source.workflow === 'analytics-12a4-category-execution-cost-probe-execution.yml',
  sourceEvent: contract.source.event === 'push',
  sourceBranch: contract.source.branch === 'main',
  sourceHeadSha: contract.source.headSha === contract.trigger.mergeSha,
  sourceArtifact: contract.source.artifact === 'phase12a4-category-execution-cost-probe',
  acceptanceBranch: contract.acceptance.branch === 'accept-analytics-12a4-category-execution-cost-probe',
  acceptanceArtifact: contract.acceptance.artifact === 'phase12a4-category-execution-cost-probe-acceptance',
  requiredSourceStatus: contract.acceptance.sourceEvidenceStatusRequired === 'observed_pass',
  requiredSourceGate: contract.acceptance.sourceGateRequired === true,
  requiredWorkflowConclusion: contract.acceptance.sourceWorkflowConclusionRequired === 'success',
  rawFilesNotRetained: contract.acceptance.rawFilesRetained === false,
  requiredJobs: JSON.stringify(contract.requiredSourceJobs) === JSON.stringify(['contract', 'production-probe']),
  readOnlyBoundary: contract.readOnlyBoundary === true,
  categoryCaptureNotAuthorized: contract.categoryCaptureAuthorized === false,
  triggerArmed: trigger.status === 'armed_for_one_time_main_push',
  executionMergeSha: trigger.expectedExecutionPackageMergeSha === '219d79351388a15a599e72f8e85228d498488f11',
  executionAccepted: execution.status === 'accepted',
  executionPr: execution.acceptance?.pr === 548,
  matchingSourceArtifact: execution.workflow?.artifactName === contract.source.artifact,
  workflowTriggerSha: /TRIGGER_SHA:\s*9637f4927fbc5e4674e3a78e285d7ea6c5049cfa/.test(workflow),
  workflowSourceName: /SOURCE_WORKFLOW:\s*analytics-12a4-category-execution-cost-probe-execution\.yml/.test(workflow),
  workflowArtifactName: /SOURCE_ARTIFACT:\s*phase12a4-category-execution-cost-probe/.test(workflow),
  workflowBranchGuard: workflow.includes("github.head_ref == 'accept-analytics-12a4-category-execution-cost-probe'"),
  workflowExactShaFilter: workflow.includes('select(.head_sha == $sha)'),
  workflowExactArtifactFilter: workflow.includes('select(.name == $name and .expired == false)'),
  workflowSourceVerifier: /verify-12a4-category-execution-cost-probe-evidence\.mjs\s+"\$RAW_DIR\/source-evidence\.json"/.test(workflow),
  workflowPassVerifier: /verify-12a4-category-execution-cost-probe-evidence\.mjs\s+"\$(?:ARTIFACT_DIR\/evidence\.json|evidence)"\s+--require-pass/.test(workflow),
  workflowRawRemoval: /rm -rf\s+"\$RAW_DIR"/.test(workflow),
  workflowEvidenceOnlyUpload: workflow.includes('path: artifacts/12a4-category-execution-cost-probe-acceptance/evidence.json'),
  workflowActionsRead: workflow.includes('actions: read'),
  workflowContentsRead: workflow.includes('contents: read'),
  workflowNoCloudflareToken: !workflow.includes('CLOUDFLARE_API_TOKEN'),
  workflowNoCloudflareAccount: !workflow.includes('CLOUDFLARE_ACCOUNT_ID'),
  workflowNoWrangler: !workflow.toLowerCase().includes('wrangler'),
  workflowNoPushTrigger: !/^\s*push:/m.test(workflow),
  workflowNoSchedule: !/^\s*schedule:/m.test(workflow),
}

const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name)
const diagnostics = {
  ok: failed.length === 0,
  workstream: contract.workstream,
  status: contract.status,
  failed,
  checks,
  triggerSha: contract.trigger.mergeSha,
  sourceWorkflow: contract.source.workflow,
  sourceArtifact: contract.source.artifact,
  acceptanceBranch: contract.acceptance.branch,
  readOnlyBoundary: contract.readOnlyBoundary,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
}

fs.mkdirSync(path.dirname(diagnosticsPath), { recursive: true })
fs.writeFileSync(diagnosticsPath, `${JSON.stringify(diagnostics, null, 2)}\n`)
console.log(JSON.stringify(diagnostics, null, 2))
if (failed.length) process.exit(1)
