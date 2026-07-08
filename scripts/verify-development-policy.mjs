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
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/audits/phase12-r12a-legal-support-baseline.json',
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
  'scripts/measure-phase11-strict-null-baseline.mjs',
  'scripts/measure-phase11-ci-ownership.mjs',
  'scripts/verify-phase11-operations-contract.mjs',
  'scripts/build-phase11-final-acceptance-evidence.mjs',
  'scripts/verify-phase11-final-acceptance-evidence.mjs',
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

const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

for (const path of ['README.md', 'docs/README.md']) check(path, [
  'Phase 11 P11A',
  'Phase 11 P11G candidate',
  'Phase 11 production closeout',
  'Phase 12 English release readiness',
  'R12A-5 candidate and hosted acceptance',
  'work-release-r12a-legal-support',
  'Candidate public HTML routes',
  '100',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A Baseline Engine',
])

check('AGENTS.md', [
  'Phase 11 P11A–P11F complete',
  'Phase 11 P11G candidate merged PR #473',
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'R12A-5 candidate and hosted acceptance',
  'Active implementation branch: work-release-r12a-legal-support',
  'Branch created: yes',
  'Candidate public HTML routes: 25',
  'Candidate browser scenarios: 100',
  'Do not start Phase 12A or Phase 16 branches before their entry gates close',
])

check('CONTRIBUTING.md', [
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'R12A-5 candidate and hosted acceptance',
  'Active implementation branch: work-release-r12a-legal-support',
  'Candidate public HTML routes: 25',
  'Candidate browser scenarios: 100',
  'R12A legal and support public-surface completion',
  'R12B Stripe and support-flow readiness',
  'R12C English launch package and release acceptance',
  'Phase 12A and Phase 16 branches must not be created before their entry gates close',
])

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) check(path, [
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness',
  'R12A-5',
  'work-release-r12a-legal-support',
  '25',
  '100',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A Baseline Engine',
  'Phase 16F Replay and Backtest',
])

check('docs/product/cross-site-quality-remediation-plan.md', [
  'Status: complete',
  'P11G final pre-merge acceptance complete',
  'P11G candidate merged PR #473',
  'Hosted production monitoring closeout complete',
  'Workflow run: 28932232525',
  'Artifact id: 8163904094',
])

check('docs/operations/phase11-production-closeout-2026-07-08.md', [
  'Status: complete',
  'Workflow run: 28932232525',
  'Artifact id: 8163904094',
  'sha256:29469a860baa8da27d9155fd5fd79a162fa39467e58bc5ee2b2b4c143f8349be',
  'Expected main SHA: 90fb2714137cc83e6f20e44415574a5e35a98439',
  'Deployed SHA: 90fb2714137cc83e6f20e44415574a5e35a98439',
  'Blocking monitoring alerts: 0',
])

check('docs/product/release-readiness-spec.md', [
  'R12A — legal and support public-surface completion',
  '/contact/', '/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/',
  'R12B — Stripe and support-flow readiness',
  'R12C — English launch package and release acceptance',
  'English source-language contract',
  'Phase 12A Analytics Capture Foundation',
])

check('docs/product/release-readiness-plan.md', [
  'R12A-0 — current legal/support surface audit',
  'R12A-5 — R12A candidate and hosted acceptance',
  'R12B-0 — evidence and configuration audit',
  'R12B-2 — refund/disclosure consistency acceptance',
  'R12C-0 — message inventory',
  'R12C-3 — release candidate acceptance',
  'work-release-r12a-legal-support',
  'Do not begin Phase 12A data/schema work before Phase 12 release acceptance closes',
])

check('docs/work-in-progress/phase12-release-readiness.md', [
  'Status: active',
  'Current workstream: R12A-5 candidate and hosted acceptance',
  'Active branch: `work-release-r12a-legal-support`',
  'Branch created: yes',
  'R12A-0 current legal/support surface audit: complete',
  'R12A-4 About/footer and route ownership integration: complete',
  'R12A-5 candidate and hosted acceptance: active',
  'Vite HTML inputs: 25',
  'Current candidate browser scenarios: 25 routes x 4 widths = 100',
])

const r12a = JSON.parse(read('docs/audits/phase12-r12a-legal-support-baseline.json'))
assert.equal(r12a.schema, 'viewloom-phase12-r12a-legal-support-baseline-v1')
assert.equal(r12a.phase, 'Phase 12')
assert.equal(r12a.workstream, 'R12A-0')
assert.equal(r12a.status, 'complete')
assert.equal(r12a.entry.vite_html_inputs, 20)
assert.equal(r12a.entry.historical_missing_surface_probes, 5)
assert.equal(r12a.missing_routes.length, 5)
assert.equal(r12a.decisions.new_route_profile, 'static_legal')
assert.equal(r12a.decisions.provider_neutral_pages_fetch_provider_status, false)
assert.equal(r12a.decisions.public_browser_pr_route_matrix_origin, 'local candidate')

check('docs/product/analytics-observation-system-spec.md', [
  'current value', 'normal state', 'Baseline Engine', 'Anomaly Detection',
  'Observed Run Intelligence', 'Category-relative Analysis',
  'Co-movement and Relationship Analysis', 'Replay and Backtest',
  'Phase 12A Analytics Capture Foundation',
])

check('docs/product/analytics-observation-system-plan.md', [
  'Phase 12A — Analytics Capture Foundation',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16B — Anomaly Detection',
  'Phase 16C — Observed Run Intelligence',
  'Phase 16D — Category-relative Analysis',
  'Phase 16E — Co-movement and Relationship Analysis',
  'Phase 16F — Replay and Backtest',
  'Do not create later-phase branches early',
])

const strict = JSON.parse(read('docs/audits/phase11-strict-null-baseline.json'))
assert.equal(strict.status, 'remediation-complete')
assert.equal(strict.baseline.scopes.app.error_count, 22)
assert.equal(strict.baseline.scopes.app.affected_file_count, 10)
assert.equal(strict.remediation.scopes.app.error_count, 0)
assert.equal(strict.remediation.scopes.functions.error_count, 0)
assert.equal(strict.result.command_line_overrides_remaining, 0)
assert.equal(strict.result.total_errors_remaining, 0)

const ci = JSON.parse(read('docs/audits/phase11-ci-ownership-baseline.json'))
assert.equal(ci.status, 'complete')
assert.equal(ci.baseline.counts.workflows_missing_latest_head_cancellation, 7)
assert.equal(ci.remediation.counts.workflows_missing_latest_head_cancellation, 0)
assert.equal(ci.latest_head.counts.workflows, 89)
assert.equal(ci.latest_head.counts.pull_request_workflows, 87)
assert.equal(ci.latest_head.counts.workflows_missing_latest_head_cancellation, 0)
assert.equal(ci.latest_head.counts.repeated_named_steps, 36)
assert.equal(ci.decision.repeated_named_steps_classified, 36)
assert.equal(ci.decision.workflows_retired_by_named_step_overlap, 0)

const overlap = JSON.parse(read('docs/audits/phase11-ci-overlap-classification.json'))
assert.equal(overlap.status, 'classified')
assert.equal(overlap.source.repeated_named_steps, 36)
assert.equal(overlap.classifications.length, 36)
assert.equal(Object.values(overlap.category_counts).reduce((sum, count) => sum + count, 0), 36)

const monitoring = JSON.parse(read('docs/audits/phase11-monitoring-contract.json'))
assert.equal(monitoring.status, 'complete')
assert.equal(monitoring.contract_evidence.result, 'pass')
assert.equal(monitoring.monitoring_owner.new_application_cron_added, false)
assert.equal(monitoring.monitoring_owner.new_collector_cron_added, false)
assert.equal(monitoring.hosted_evidence.status, 'complete')
assert.equal(monitoring.hosted_evidence.workflow_run, 28932232525)
assert.equal(monitoring.hosted_evidence.artifact_id, 8163904094)
assert.equal(monitoring.hosted_evidence.expected_main_sha, '90fb2714137cc83e6f20e44415574a5e35a98439')
assert.equal(monitoring.hosted_evidence.deployed_sha, '90fb2714137cc83e6f20e44415574a5e35a98439')
assert.equal(monitoring.hosted_evidence.result, 'pass')
assert.equal(monitoring.hosted_evidence.blocking_alerts, 0)
assert.equal(monitoring.hosted_evidence.watch_alerts, 2)
assert.equal(monitoring.hosted_evidence.phase11_production_closeout_satisfied, true)

const historicalOwnership = JSON.parse(read('docs/audits/phase11-public-acceptance-ownership.json'))
assert.equal(historicalOwnership.status, 'complete')
assert.equal(historicalOwnership.counts.routes, 20)
assert.equal(historicalOwnership.requirements.provider_binding_crossing_failures, 0)
assert.equal(historicalOwnership.requirements.route_duplicates, 0)

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
assert.equal(inventory.active_branch, 'work-release-r12a-legal-support')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 5)
assert.equal(gaps.historical_missing_surface_baseline.count, 5)
assert.equal(gaps.cross_route_gaps.find((item) => item.id === 'policy-surfaces-missing')?.state, 'candidate_implementation')

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
console.log('- Phase 10 is complete through U10H closeout')
console.log('- Phase 11 P11A through P11G and hosted production closeout are complete')
console.log('- Phase 12 English release readiness is active at R12A-5 candidate and hosted acceptance')
console.log('- active branch is work-release-r12a-legal-support')
console.log('- current candidate owns 25 HTML routes and 100 browser scenarios')
console.log('- five legal/support surfaces remain candidate until exact production acceptance passes')
console.log('- Phase 12A capture, Phase 15 calibration, and Phase 16A-F analytics gates remain canonical')
console.log('- Twitch and Kick remain separate')
