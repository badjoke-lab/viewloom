import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/u10h-production-acceptance-2026-07-04.md',
  'docs/operations/phase11-monitoring-and-escalation.md',
  'docs/operations/phase11-maintenance-cadence.md',
  'docs/operations/phase11-production-closeout-2026-07-08.md',
  'docs/operations/r12a-production-acceptance-2026-07-08.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/audits/phase12-r12a-legal-support-baseline.json',
  'docs/audits/r12a-production-acceptance.json',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'docs/audits/phase11-strict-null-baseline.json',
  'docs/audits/phase11-ci-ownership-baseline.json',
  'docs/audits/phase11-ci-overlap-classification.json',
  'docs/audits/phase11-monitoring-contract.json',
  'docs/audits/phase11-public-acceptance-ownership.json',
  'apps/web/src/static-page.ts',
  'apps/web/src/legal-page.css',
  'apps/web/contact/index.html',
  'apps/web/terms/index.html',
  'apps/web/privacy/index.html',
  'apps/web/refund-policy/index.html',
  'apps/web/commercial-disclosure/index.html',
  'apps/web/scripts/public-current-browser-audit.mjs',
  'scripts/verify-public-current-browser-audit.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/release-r12a-legal-support.yml',
  '.github/workflows/phase11-strict-null-baseline.yml',
  '.github/workflows/phase11-ci-ownership.yml',
  '.github/workflows/phase11-monitoring-contract.yml',
  '.github/workflows/phase11-operations-contract.yml',
  '.github/workflows/phase11-public-acceptance-ownership.yml',
  '.github/workflows/phase11-final-acceptance.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
assert.equal(existsSync(join(root, 'docs/work-in-progress/phase11-acceptance-operations.md')), false, 'completed Phase 11 working note must be retired')
assert.equal(existsSync(join(root, '.github/workflows/phase11-hosted-closeout-acceptance.yml')), false, 'temporary Phase 11 hosted closeout workflow must be removed')
assert.equal(existsSync(join(root, '.github/workflows/release-r12a-production-closeout.yml')), false, 'temporary R12A production closeout workflow must be removed before merge')
assert.equal(existsSync(join(root, 'docs/audits/r12a-candidate-acceptance-marker.md')), false, 'R12A candidate marker must be retired after production acceptance')

const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

for (const path of ['README.md', 'docs/README.md']) check(path, [
  'Phase 11',
  'Phase 12 English release readiness',
  'R12A',
  'complete',
  'R12B',
  'active',
  'work-release-r12b-stripe-support-flow',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A Baseline Engine',
])

check('AGENTS.md', [
  'Phase 11 P11A-P11G complete',
  'Phase 11 production closeout complete',
  'R12A legal/support public surface complete',
  'R12A production acceptance pass',
  'Current workstream: R12B-0 evidence and configuration audit',
  'Exact next implementation branch: work-release-r12b-stripe-support-flow',
  'Next branch created: no',
])

check('CONTRIBUTING.md', [
  'Phase 11 production closeout complete',
  'R12A legal and support public-surface completion complete',
  'R12A production acceptance pass',
  'Current workstream: R12B-0 evidence and configuration audit',
  'Exact next implementation branch: work-release-r12b-stripe-support-flow',
  'R12A legal and support public-surface completion',
  'R12B Stripe and support-flow readiness',
  'R12C English launch package and release acceptance',
])

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) check(path, [
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness',
  'R12A',
  'complete',
  'R12B',
  'active',
  'work-release-r12b-stripe-support-flow',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A Baseline Engine',
  'Phase 16F Replay and Backtest',
])

check('docs/operations/phase11-production-closeout-2026-07-08.md', [
  'Status: complete',
  'Workflow run: 28932232525',
  'Blocking monitoring alerts: 0',
])

check('docs/operations/r12a-production-acceptance-2026-07-08.md', [
  'Status: complete',
  'Workstream: R12A-5',
  'Implementation PR: #477',
  '952f0008209363f4fd5b22587975ac247ee8d6f2',
  'Workflow run: `28941169278`',
  'Repository-owned HTML routes: 25',
  'Blocking monitoring alerts: 0',
  'R12B-0 evidence and configuration audit',
])

check('docs/product/release-readiness-spec.md', [
  'R12A — legal and support public-surface completion',
  '/contact/', '/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/',
  'R12B — Stripe and support-flow readiness',
  'R12C — English launch package and release acceptance',
  'Phase 12A Analytics Capture Foundation',
])

check('docs/product/release-readiness-plan.md', [
  'R12A-5 — R12A candidate and hosted acceptance',
  'R12B-0 — evidence and configuration audit',
  'R12B-2 — refund/disclosure consistency acceptance',
  'R12C-3 — release candidate acceptance',
  'Do not begin Phase 12A data/schema work before Phase 12 release acceptance closes',
])

check('docs/work-in-progress/phase12-release-readiness.md', [
  'Status: active',
  'Current workstream: R12B-0 evidence and configuration audit',
  'Exact next implementation branch: `work-release-r12b-stripe-support-flow`',
  'Next branch created: no',
  'R12A legal and support public-surface completion   complete',
  'R12B Stripe and support-flow readiness             active',
  'Implementation PR: #477',
  'Production workflow run: 28941169278',
])

const r12aBaseline = JSON.parse(read('docs/audits/phase12-r12a-legal-support-baseline.json'))
assert.equal(r12aBaseline.schema, 'viewloom-phase12-r12a-legal-support-baseline-v1')
assert.equal(r12aBaseline.status, 'complete')
assert.equal(r12aBaseline.entry.vite_html_inputs, 20)
assert.equal(r12aBaseline.entry.historical_missing_surface_probes, 5)
assert.equal(r12aBaseline.missing_routes.length, 5)
assert.equal(r12aBaseline.decisions.new_route_profile, 'static_legal')
assert.equal(r12aBaseline.decisions.provider_neutral_pages_fetch_provider_status, false)

const r12aAcceptance = JSON.parse(read('docs/audits/r12a-production-acceptance.json'))
assert.equal(r12aAcceptance.schema, 'viewloom-r12a-production-acceptance-v1')
assert.equal(r12aAcceptance.phase, 'Phase 12')
assert.equal(r12aAcceptance.workstream, 'R12A-5')
assert.equal(r12aAcceptance.status, 'complete')
assert.equal(r12aAcceptance.result, 'pass')
assert.equal(r12aAcceptance.workflow_run, 28941169278)
assert.equal(r12aAcceptance.expected_main_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(r12aAcceptance.deployed_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(r12aAcceptance.counts.html_routes, 25)
assert.equal(r12aAcceptance.counts.provider_status_apis, 2)
assert.equal(r12aAcceptance.counts.provider_crossing_failures, 0)
assert.equal(r12aAcceptance.counts.blocking_alerts, 0)
assert.equal(r12aAcceptance.checks.explicit_404, true)

check('docs/product/analytics-observation-system-spec.md', [
  'Baseline Engine', 'Anomaly Detection', 'Observed Run Intelligence',
  'Category-relative Analysis', 'Co-movement and Relationship Analysis',
  'Replay and Backtest', 'Phase 12A Analytics Capture Foundation',
])
check('docs/product/analytics-observation-system-plan.md', [
  'Phase 12A — Analytics Capture Foundation',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
  'Do not create later-phase branches early',
])

const strict = JSON.parse(read('docs/audits/phase11-strict-null-baseline.json'))
assert.equal(strict.status, 'remediation-complete')
assert.equal(strict.remediation.scopes.app.error_count, 0)
assert.equal(strict.remediation.scopes.functions.error_count, 0)
assert.equal(strict.result.command_line_overrides_remaining, 0)
assert.equal(strict.result.total_errors_remaining, 0)

const ci = JSON.parse(read('docs/audits/phase11-ci-ownership-baseline.json'))
assert.equal(ci.status, 'complete')
assert.equal(ci.remediation.counts.workflows_missing_latest_head_cancellation, 0)
assert.equal(ci.decision.workflows_retired_by_named_step_overlap, 0)

const overlap = JSON.parse(read('docs/audits/phase11-ci-overlap-classification.json'))
assert.equal(overlap.status, 'classified')
assert.equal(overlap.classifications.length, 36)

const monitoring = JSON.parse(read('docs/audits/phase11-monitoring-contract.json'))
assert.equal(monitoring.status, 'complete')
assert.equal(monitoring.contract_evidence.result, 'pass')
assert.equal(monitoring.monitoring_owner.new_application_cron_added, false)
assert.equal(monitoring.monitoring_owner.new_collector_cron_added, false)
assert.equal(monitoring.hosted_evidence.result, 'pass')
assert.equal(monitoring.hosted_evidence.blocking_alerts, 0)

const historicalOwnership = JSON.parse(read('docs/audits/phase11-public-acceptance-ownership.json'))
assert.equal(historicalOwnership.status, 'complete')
assert.equal(historicalOwnership.counts.routes, 20)
assert.equal(historicalOwnership.requirements.provider_binding_crossing_failures, 0)

const baseTsconfig = JSON.parse(read('tsconfig.base.json'))
assert.equal(baseTsconfig.compilerOptions.strict, true)
const webPackage = JSON.parse(read('apps/web/package.json'))
for (const name of ['typecheck', 'typecheck:app', 'typecheck:functions']) {
  assert.equal(webPackage.scripts[name].includes('--strictNullChecks false'), false, `${name}: strict-null override remains`)
}

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.indexable_routes, 21)
assert.equal(inventory.counts.sitemap_routes, 21)
assert.equal(inventory.counts.public_readiness_configured_pages, 25)
assert.equal(inventory.counts.production_smoke_page_routes, 25)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.source.accepted_main_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(inventory.active_program, 'Phase 12 R12B Stripe and support-flow readiness')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)
assert.equal(gaps.resolved_surfaces.length, 5)
assert.equal(gaps.historical_missing_surface_baseline.count, 5)
assert.equal(gaps.cross_route_gaps.find((item) => item.id === 'policy-surfaces-missing')?.state, 'resolved')

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/release-r12a-legal-support.yml',
  '.github/workflows/phase11-strict-null-baseline.yml',
  '.github/workflows/phase11-ci-ownership.yml',
  '.github/workflows/phase11-monitoring-contract.yml',
  '.github/workflows/phase11-operations-contract.yml',
  '.github/workflows/phase11-public-acceptance-ownership.yml',
  '.github/workflows/phase11-final-acceptance.yml',
]) {
  const source = read(path)
  assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

console.log('ViewLoom development and documentation verification passed.')
console.log('- Phase 10 and Phase 11 closeouts remain complete')
console.log('- R12A production acceptance is complete at exact main SHA 952f0008209363f4fd5b22587975ac247ee8d6f2')
console.log('- five R12A legal/support surfaces are resolved')
console.log('- Phase 12 English release readiness is active at R12B-0 evidence and configuration audit')
console.log('- exact next branch is work-release-r12b-stripe-support-flow and remains uncreated')
console.log('- current inventory owns 25 HTML routes and 100 browser scenarios')
console.log('- Phase 12A capture, Phase 15 calibration, and Phase 16A-F analytics gates remain canonical')
console.log('- Twitch and Kick remain separate')
