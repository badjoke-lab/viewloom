import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const json = (path) => JSON.parse(read(path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
  }
}

const required = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/phase11-production-closeout-2026-07-08.md',
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/english-launch-copy.md',
  'docs/product/launch-asset-captions.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/audits/r12c3-candidate-acceptance.json',
  'docs/audits/r12c3-release-candidate-contract.json',
  'docs/audits/r12c1-launch-copy-package.json',
  'docs/audits/r12c2-launch-assets-capture.json',
  'docs/audits/r12c2-launch-asset-manifest.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'scripts/verify-phase12-release-acceptance.mjs',
  'scripts/verify-r12c1-launch-copy-package.mjs',
  'scripts/verify-r12c2-launch-assets-package.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) {
  assert.equal(exists(path), true, `missing file: ${path}`)
}

for (const asset of [
  'viewloom-desktop.png',
  'viewloom-mobile.png',
  'twitch-heatmap.png',
  'twitch-day-flow.png',
  'twitch-battle-lines.png',
  'twitch-history.png',
]) {
  assert.equal(exists(`apps/web/public/launch-assets/${asset}`), true, `missing R12C-2 asset: ${asset}`)
}

for (const retired of [
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  '.github/workflows/phase11-hosted-closeout-acceptance.yml',
  '.github/workflows/release-r12a-production-closeout.yml',
  '.github/workflows/release-r12c3-release-candidate.yml',
  '.github/workflows/release-phase12-hosted-closeout.yml',
  'scripts/verify-phase12-hosted-closeout-probe.mjs',
]) {
  assert.equal(exists(retired), false, `retired temporary file must be absent: ${retired}`)
}

for (const path of [
  'README.md',
  'docs/README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) {
  check(path, [
    'Phase 12',
    'complete',
    'Phase 12A',
    '12A-0 current data and capacity baseline',
    'work-analytics-12a0-current-data-capacity-baseline',
  ])
}

check('AGENTS.md', [
  'Current workstream: 12A-0 current data and capacity baseline',
  'Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline',
  'Next branch created: no',
])
check('CONTRIBUTING.md', [
  'Current workstream: 12A-0 current data and capacity baseline',
  'Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline',
  'Next branch created: no',
])

const phase12 = json('docs/audits/phase12-release-acceptance.json')
assert.equal(phase12.schema, 'viewloom-phase12-release-acceptance-v1')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.productionAcceptance.targetMainSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(phase12.productionAcceptance.deployedSha, phase12.productionAcceptance.targetMainSha)
assert.equal(phase12.productionAcceptance.workflowRunId, 28993206779)
assert.equal(phase12.productionAcceptance.artifactId, 8188712759)
assert.equal(phase12.productionAcceptance.publicRoutesChecked, 25)
assert.equal(phase12.productionAcceptance.providerCrossingFailures, 0)
assert.equal(phase12.productionAcceptance.explicit404Failures, 0)
assert.equal(phase12.productionAcceptance.monitoring.blockingAlerts, 0)
assert.equal(phase12.independentCloseoutProbe.workflowRunId, 28993547481)
assert.equal(phase12.independentCloseoutProbe.result, 'pass')
assert.equal(phase12.completion.phase12Complete, true)
assert.equal(phase12.completion.nextProgram, 'Phase 12A Analytics Capture Foundation')
assert.equal(phase12.completion.nextWorkstream, '12A-0 current data and capacity baseline')
assert.equal(phase12.completion.nextBranch, 'work-analytics-12a0-current-data-capacity-baseline')
assert.equal(phase12.capacityCarryForward.authorizationToExpandWindows, false)
assert.equal(phase12.capacityCarryForward.authorizationToExtendRawRetention, false)

const candidate = json('docs/audits/r12c3-candidate-acceptance.json')
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.browser.routes, 25)
assert.equal(candidate.browser.viewports, 4)
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)
assert.equal(candidate.browser.providerCrossingScenarios, 0)
assert.equal(candidate.browser.legalMobileTargetFailures, 0)

const contract = json('docs/audits/r12c3-release-candidate-contract.json')
assert.equal(contract.status, 'complete')
assert.equal(contract.closeout.result, 'pass')
assert.equal(contract.closeout.candidateMergeSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(contract.closeout.productionSmokeRunId, 28993206779)
assert.equal(contract.closeout.independentCloseoutProbeRunId, 28993547481)

const r12c1 = json('docs/audits/r12c1-launch-copy-package.json')
assert.equal(r12c1.status, 'complete')
assert.equal(r12c1.feature_roles.length, 7)
assert.equal(r12c1.faq.length, 12)
assert.equal(r12c1.completion.r12c1_complete, true)

const r12c2Capture = json('docs/audits/r12c2-launch-assets-capture.json')
assert.equal(r12c2Capture.result, 'pass')
assert.equal(r12c2Capture.assets.length, 6)
assert.equal(r12c2Capture.violations.length, 0)

const r12c2Manifest = json('docs/audits/r12c2-launch-asset-manifest.json')
assert.equal(r12c2Manifest.assetCount, 6)
assert.equal(r12c2Manifest.assets.length, 6)
assert.equal(r12c2Manifest.capture.result, 'pass')
assert.equal(r12c2Manifest.packageVerification.result, 'pass')

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.counts.sitemap_routes, 21)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = json('docs/audits/public-surface-gaps.json')
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)
assert.equal(gaps.resolved_surfaces.length, 5)

check('docs/product/analytics-observation-system-plan.md', [
  'Phase 12A — Analytics Capture Foundation',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
])

console.log('Development and documentation policy verification passed.')
console.log('- Phase 12 permanent acceptance is complete and exact-SHA bound')
console.log('- Phase 12 working note and temporary closeout/candidate tools are retired')
console.log('- current program is Phase 12A Analytics Capture Foundation')
console.log('- current workstream is 12A-0 current data and capacity baseline')
console.log('- exact next branch is work-analytics-12a0-current-data-capacity-baseline and remains uncreated')
console.log('- Twitch/Kick separation and bounded-capacity constraints remain enforced')
