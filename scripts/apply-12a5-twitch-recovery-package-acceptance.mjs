import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const policyPath = 'scripts/verify-category-rollout-policy.mjs'
const roadmapPath = 'docs/product/current-roadmap.md'
const schedulePath = 'docs/product/current-schedule.md'
const wipPath = 'docs/work-in-progress/phase12a4-category-parallel-execution.md'
const contractPath = 'docs/audits/12a5-twitch-permanent-category-recovery-contract.json'

const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
if (gate.schemaVersion !== 'viewloom-12a2-current-gate-state-v32') throw new Error(`unexpected_gate_schema:${gate.schemaVersion}`)
if (gate.status !== '12a5_twitch_permanent_category_capture_regressed_recovery_required') throw new Error(`unexpected_gate_status:${gate.status}`)
if (contract.status !== 'accepted') throw new Error(`unexpected_recovery_contract_status:${contract.status}`)
if (contract.acceptance?.packagePr !== 653) throw new Error('unexpected_package_pr')
if (contract.acceptance?.packageMergeSha !== '698c99aa543e9d4ee9d0e710c88ade52171f4d79') throw new Error('unexpected_package_merge')
if (contract.acceptance?.mainPushBothDeploymentsSkipped !== true) throw new Error('main_push_deployment_not_proven_absent')

gate.categoryCapture.twitchRecoveryPackageAccepted = true
gate.currentWorkstream.twitchRecoveryPackageAccepted = true
gate.currentWorkstream.twitchRecoveryPackagePr = 653
gate.currentWorkstream.twitchRecoveryPackageAcceptancePr = 654
gate.currentWorkstream.twitchRecoveryPackageMergeSha = '698c99aa543e9d4ee9d0e710c88ade52171f4d79'
gate.currentWorkstream.exactTwitchRecoveryTriggerCurrent = false
gate.nextWorkstream = 'create a separate exact one-file Twitch recovery trigger using accepted package merge 698c99aa543e9d4ee9d0e710c88ade52171f4d79 and a start boundary no more than three hours ahead'
gate.twitchPermanentCategoryRecoveryPackage = {
  status: 'accepted_dormant',
  trackingIssue: 652,
  packagePr: 653,
  packageAcceptancePr: 654,
  packageMergeSha: '698c99aa543e9d4ee9d0e710c88ade52171f4d79',
  contract: contractPath,
  validationRunId: 30360346312,
  verificationJobId: 90278746118,
  readOnlyPreflightJobId: 90278745948,
  preflightArtifactId: 8688570859,
  preflightArtifactDigest: 'sha256:3a1b3b2a0121b767a2de981f794ab45d6a08fcac7aef43efe99fcaa0dd4864cc',
  providerScopedDeployValidationRunId: 30360346437,
  providerScopedDeployVerifyJobId: 90278745524,
  providerScopedDeployPlanJobId: 90278826865,
  mainPushDeployRunId: 30360738542,
  mainPushDeployVerifyJobId: 90279611584,
  mainPushDeployPlanJobId: 90279690301,
  mainPushTwitchDeployJobId: 90279758863,
  mainPushKickDeployJobId: 90279759176,
  mainPushBothDeploymentsSkipped: true,
  runtimeActive: false,
  productionWorkerPublished: false,
  remoteD1MutationPerformed: false,
  kickChanged: false,
  publicExposureEnabled: false,
}
fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)

let policy = fs.readFileSync(policyPath, 'utf8')
const marker = "assert.equal(twitchRecovery.trackingIssue, 652)"
if (!policy.includes(marker)) throw new Error('policy_recovery_marker_missing')
policy = policy.replace(marker, `${marker}\nassert.equal(twitchRecovery.status, 'accepted')\nassert.equal(twitchRecovery.acceptance.packagePr, 653)\nassert.equal(twitchRecovery.acceptance.packageMergeSha, '698c99aa543e9d4ee9d0e710c88ade52171f4d79')\nassert.equal(twitchRecovery.acceptance.mainPushBothDeploymentsSkipped, true)\nassert.equal(gate.categoryCapture.twitchRecoveryPackageAccepted, true)\nassert.equal(gate.currentWorkstream.twitchRecoveryPackageAccepted, true)\nassert.equal(gate.currentWorkstream.twitchRecoveryPackagePr, 653)\nassert.equal(gate.currentWorkstream.twitchRecoveryPackageAcceptancePr, 654)\nassert.equal(gate.currentWorkstream.exactTwitchRecoveryTriggerCurrent, false)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.status, 'accepted_dormant')\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.mainPushBothDeploymentsSkipped, true)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.runtimeActive, false)\nassert.equal(gate.twitchPermanentCategoryRecoveryPackage.kickChanged, false)`)
fs.writeFileSync(policyPath, policy)

function replaceInFile(file, before, after) {
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes(before)) throw new Error(`fragment_missing:${file}:${before.slice(0, 80)}`)
  source = source.replace(before, after)
  fs.writeFileSync(file, source)
}

replaceInFile(roadmapPath,
  '- The first Twitch seven-day audit was executed read-only in PR #651 and correctly rejected after detecting a production configuration regression.',
  '- The first Twitch seven-day audit was executed read-only in PR #651 and correctly rejected after detecting a production configuration regression.\n- The dormant Twitch recovery package and provider-scoped deployment protection were accepted through PR #653 and PR #654 without production deployment.')
replaceInFile(roadmapPath,
  '4. Prepare and accept a dormant Twitch-only recovery package under Issue #652.',
  '4. Dormant Twitch-only recovery package accepted in PR #653 and PR #654; create the separate exact one-file recovery trigger next.')
replaceInFile(schedulePath,
  '3. Accept the dormant Twitch recovery package without production deployment.',
  '3. Dormant Twitch recovery package accepted through PR #653 and PR #654 without production deployment.')
replaceInFile(schedulePath,
  '4. Create a separate exact one-file recovery trigger with a bounded start time.',
  '4. Create a separate exact one-file recovery trigger using accepted package merge `698c99aa543e9d4ee9d0e710c88ade52171f4d79` and a bounded start time.')
replaceInFile(wipPath,
  '3. Accept a dormant Twitch-only recovery workflow with no trigger in its package PR.',
  '3. Dormant Twitch-only recovery workflow accepted through PR #653 and PR #654; no trigger or production deployment was included.')
replaceInFile(wipPath,
  '4. Create a separate exact one-file trigger after package acceptance.',
  '4. Create a separate exact one-file trigger using accepted package merge `698c99aa543e9d4ee9d0e710c88ade52171f4d79`.')

console.log(JSON.stringify({
  ok: true,
  gateSchema: gate.schemaVersion,
  gateStatus: gate.status,
  recoveryPackageStatus: gate.twitchPermanentCategoryRecoveryPackage.status,
  packagePr: gate.twitchPermanentCategoryRecoveryPackage.packagePr,
  acceptancePr: gate.twitchPermanentCategoryRecoveryPackage.packageAcceptancePr,
  runtimeActive: gate.twitchPermanentCategoryRecoveryPackage.runtimeActive,
  nextWorkstream: gate.nextWorkstream,
}, null, 2))
