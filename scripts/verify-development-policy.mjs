import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const json = (path) => JSON.parse(read(path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const canonicalDocs = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]

for (const path of [
  ...canonicalDocs,
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/audits/12a1-analytics-field-contract.json',
  'docs/audits/12a1-source-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a3-generator-enablement-contract.json',
  'docs/audits/12a3-generator-enablement-evidence.json',
  'docs/audits/12a3-postmerge-acceptance-contract.json',
  'docs/audits/12a3-postmerge-acceptance-evidence.json',
  'docs/audits/12a4-category-source-audit-contract.json',
  'docs/audits/12a4-category-source-audit-evidence.json',
  'docs/operations/12a3-generator-enablement-acceptance-2026-07-12.md',
  'docs/operations/12a3-postmerge-acceptance-2026-07-12.md',
  'docs/operations/12a4-category-source-audit-2026-07-12.md',
  'workers/shared/intraday-rollup.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
]) assert.equal(exists(path), true, `missing file: ${path}`)

for (const retired of [
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
  'docs/work-in-progress/phase12a1-field-contract.md',
  'docs/work-in-progress/phase12a2-intraday-rollup-design.md',
  'docs/work-in-progress/phase12a2-binding-size-gate.md',
  'docs/work-in-progress/phase12a2-migration.md',
  'docs/work-in-progress/phase12a2-remote-schema-probe.md',
  'docs/work-in-progress/phase12a2-controlled-remote-apply.md',
  'docs/work-in-progress/phase12a2-collector-worker-deploy.md',
  'docs/work-in-progress/phase12a3-account-storage-gate.md',
  'docs/work-in-progress/phase12a3-execution-cost-probe.md',
  'docs/work-in-progress/phase12a3-generator-enablement.md',
  'docs/work-in-progress/phase12a3-postmerge-acceptance.md',
  'docs/work-in-progress/phase12a4-category-source-audit.md',
  '.github/workflows/analytics-12a4-category-source-audit.yml',
  'workers/category-source-audit/shared.ts',
  'workers/category-source-audit/twitch.ts',
  'workers/category-source-audit/kick.ts',
  'workers/category-source-audit/wrangler.twitch.toml',
  'workers/category-source-audit/wrangler.kick.toml',
  'scripts/collect-12a4-category-source-evidence.mjs',
  'scripts/verify-12a4-category-source-audit-package.mjs',
  'scripts/check-12a4-category-source-audit-scope.mjs',
]) assert.equal(exists(retired), false, `retired one-time file still present: ${retired}`)

for (const path of canonicalDocs) {
  check(path, ['PR #513', 'category source audit', 'storage design', 'runtime capture'])
}

for (const path of canonicalDocs) {
  const source = read(path)
  assert.equal(source.includes('bounded_generator_not_implemented'), false, `${path}: stale 12A-3 boundary`)
  assert.equal(source.includes('Production generation started no'), false, `${path}: stale generation state`)
  assert.equal(source.includes('category capture remains unapproved for both providers'), false, `${path}: stale category source state`)
}

const enablement = json('docs/audits/12a3-generator-enablement-evidence.json')
assert.equal(enablement.status, 'accepted')
assert.equal(enablement.providerSeparated, true)
assert.equal(enablement.acceptanceIdentity.pr, 510)

const postmerge = json('docs/audits/12a3-postmerge-acceptance-evidence.json')
assert.equal(postmerge.status, 'accepted')
assert.equal(postmerge.merge.pr, 510)
assert.equal(postmerge.merge.sha, 'ad90585d74149b0fb1805b9a76fd8d796a5e7c2d')
assert.equal(postmerge.deployment.runId, 29191094150)
assert.equal(postmerge.deployment.gatePass, true)
assert.equal(postmerge.providers.twitch.providerGatePass, true)
assert.equal(postmerge.providers.kick.providerGatePass, true)
assert.equal(postmerge.gate.postMergeAccumulationPass, true)

const categoryContract = json('docs/audits/12a4-category-source-audit-contract.json')
assert.equal(categoryContract.status, 'accepted')
assert.equal(categoryContract.providerSeparated, true)
assert.equal(categoryContract.acceptedEvidence.pr, 513)
assert.equal(categoryContract.acceptedEvidence.workflowRunId, 29195340633)
assert.equal(categoryContract.providers.twitch.providerIdPath, 'game_id')
assert.equal(categoryContract.providers.twitch.namePath, 'game_name')
assert.equal(categoryContract.providers.twitch.minimumObservedPresenceRatio, 1)
assert.equal(categoryContract.providers.kick.providerIdPath, 'category.id')
assert.equal(categoryContract.providers.kick.namePath, 'category.name')
assert.equal(categoryContract.providers.kick.minimumObservedPresenceRatio, 1)
assert.equal(categoryContract.gate.categorySourceAuditPass, true)
assert.equal(categoryContract.gate.storageDesignAuthorized, true)
assert.equal(categoryContract.gate.runtimeCaptureAuthorized, false)

const categoryEvidence = json('docs/audits/12a4-category-source-audit-evidence.json')
assert.equal(categoryEvidence.status, 'accepted')
assert.equal(categoryEvidence.acceptanceIdentity.pr, 513)
assert.equal(categoryEvidence.acceptanceIdentity.workflowRunId, 29195340633)
assert.equal(categoryEvidence.acceptanceIdentity.artifactId, 8260821948)
assert.equal(categoryEvidence.providerSeparated, true)
assert.equal(categoryEvidence.providers.twitch.captureApproved, true)
assert.equal(categoryEvidence.providers.twitch.selectedSourceContract.providerIdPath, 'game_id')
assert.equal(categoryEvidence.providers.twitch.selectedSourceContract.namePath, 'game_name')
assert.equal(categoryEvidence.providers.kick.captureApproved, true)
assert.equal(categoryEvidence.providers.kick.selectedSourceContract.providerIdPath, 'category.id')
assert.equal(categoryEvidence.providers.kick.selectedSourceContract.namePath, 'category.name')
assert.equal(categoryEvidence.providers.kick.alternateEvidenceCannotApprovePrimary, true)
assert.equal(categoryEvidence.gate.lifecyclePass, true)
assert.equal(categoryEvidence.gate.categorySourceAuditPass, true)
assert.equal(categoryEvidence.gate.storageDesignAuthorized, true)
assert.equal(categoryEvidence.gate.runtimeCaptureAuthorized, false)
assert.equal(categoryEvidence.boundaries.mainCollectorsRestored, true)
for (const value of Object.values(categoryEvidence.privacy)) assert.equal(value, false)

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.purposes.category.twitch.captureApproved, true)
assert.equal(fieldContract.purposes.category.twitch.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, true)
assert.equal(fieldContract.purposes.category.kick.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)
assert.equal(fieldContract.purposes.category.combinedProviderCategoryRankingAllowed, false)

const sourceEvidence = json('docs/audits/12a1-source-evidence.json')
assert.equal(sourceEvidence.schemaVersion, 'viewloom-12a1-source-evidence-v2')
assert.equal(sourceEvidence.providers.twitch.category.providerIdPath, 'game_id')
assert.equal(sourceEvidence.providers.twitch.category.namePath, 'game_name')
assert.equal(sourceEvidence.providers.twitch.category.captureApproved, true)
assert.equal(sourceEvidence.providers.kick.category.providerIdPath, 'category.id')
assert.equal(sourceEvidence.providers.kick.category.namePath, 'category.name')
assert.equal(sourceEvidence.providers.kick.category.captureApproved, true)
assert.equal(sourceEvidence.crossProviderIdentity.categoryIdentityEquivalenceAllowed, false)
assert.equal(sourceEvidence.crossProviderIdentity.combinedProviderCategoryRankingAllowed, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v10')
assert.equal(state.status, '12a4_category_sources_accepted_storage_design_current')
assert.equal(state.categorySourceAudit.pr, 513)
assert.equal(state.categorySourceAudit.lifecyclePass, true)
assert.equal(state.categorySourceAudit.storageDesignAuthorized, true)
assert.equal(state.categorySourceAudit.runtimeCaptureAuthorized, false)
assert.equal(state.categoryCapture.sourceContractAccepted, true)
assert.equal(state.categoryCapture.storageDesignAuthorized, true)
assert.equal(state.categoryCapture.storageDesignAccepted, false)
assert.equal(state.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(state.categoryCapture.runtimeCaptureStarted, false)
assert.equal(state.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(state.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(state.currentWorkstream.phase, '12A-4')
assert.equal(state.currentWorkstream.name, 'provider-specific category storage design and budget gate')
assert.equal(state.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(state.nextWorkstream, '12A-4 provider-specific category storage design and budget gate')

console.log('Development and documentation policy verification passed.')
console.log('- 12A-3 generation is enabled and accumulating')
console.log('- 12A-4 category source audit accepted PR #513')
console.log('- Twitch source: game_id / game_name')
console.log('- Kick source: category.id / category.name')
console.log('- current workstream: provider-specific category storage design and budget gate')
console.log('- runtime category capture remains disabled')
