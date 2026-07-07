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
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/phase11-strict-null-baseline.json',
  'docs/audits/phase11-ci-ownership-baseline.json',
  'docs/audits/phase11-ci-overlap-classification.json',
  'docs/audits/phase11-monitoring-contract.json',
  'docs/audits/phase11-public-acceptance-ownership.json',
  'scripts/measure-phase11-strict-null-baseline.mjs',
  'scripts/measure-phase11-ci-ownership.mjs',
  'scripts/verify-phase11-operations-contract.mjs',
  'scripts/build-phase11-final-acceptance-evidence.mjs',
  'scripts/verify-phase11-final-acceptance-evidence.mjs',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/phase11-strict-null-baseline.yml',
  '.github/workflows/phase11-ci-ownership.yml',
  '.github/workflows/phase11-monitoring-contract.yml',
  '.github/workflows/phase11-operations-contract.yml',
  '.github/workflows/phase11-public-acceptance-ownership.yml',
  '.github/workflows/phase11-final-acceptance.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

for (const path of ['README.md', 'docs/README.md']) check(path, [
  'Phase 11 P11A',
  'Phase 11 P11B',
  'Phase 11 P11C',
  'Phase 11 P11D',
  'Phase 11 P11E',
  'Phase 11 P11F',
  'Phase 11 P11G',
  'work-quality-phase11-acceptance-operations',
  'P11G final pre-merge acceptance',
])

check('AGENTS.md', [
  'Phase 11 P11A–P11F complete',
  'Phase 11 P11G final acceptance active',
  'Current workstream: P11G final pre-merge acceptance',
])
check('CONTRIBUTING.md', [
  'Phase 11 P11A–P11F complete',
  'Phase 11 P11G final acceptance active',
  'Current workstream: P11G final pre-merge acceptance',
])
for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-plan.md',
]) check(path, [
  'P11G final pre-merge acceptance',
  'work-quality-phase11-acceptance-operations',
])

check('docs/work-in-progress/phase11-acceptance-operations.md', [
  'P11A strict-null migration — complete',
  'P11B CI ownership and duplication audit — complete',
  'P11C monitoring contract — complete; hosted closeout after merge',
  'P11D escalation runbook — complete',
  'P11E maintenance cadence — complete',
  'P11F all-public acceptance ownership — complete',
  'P11G final acceptance — active',
  'all 36 latest-head repeated named steps classified',
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
assert.equal(ci.decision.workflow_retirement_requires_named_replacement_assertions, true)

const overlap = JSON.parse(read('docs/audits/phase11-ci-overlap-classification.json'))
assert.equal(overlap.status, 'classified')
assert.equal(overlap.source.repeated_named_steps, 36)
assert.equal(overlap.classifications.length, 36)
assert.equal(Object.values(overlap.category_counts).reduce((sum, count) => sum + count, 0), 36)
assert.equal(overlap.decision.workflows_retired_by_named_step_overlap, 0)

const monitoring = JSON.parse(read('docs/audits/phase11-monitoring-contract.json'))
assert.equal(monitoring.contract_evidence.result, 'pass')
assert.equal(monitoring.monitoring_owner.new_application_cron_added, false)
assert.equal(monitoring.monitoring_owner.new_collector_cron_added, false)
assert.equal(monitoring.hosted_evidence.status, 'pending-main-merge')

const ownership = JSON.parse(read('docs/audits/phase11-public-acceptance-ownership.json'))
assert.equal(ownership.status, 'complete')
assert.equal(ownership.counts.routes, 20)
assert.equal(ownership.requirements.provider_binding_crossing_failures, 0)
assert.equal(ownership.requirements.route_duplicates, 0)

const baseTsconfig = JSON.parse(read('tsconfig.base.json'))
assert.equal(baseTsconfig.compilerOptions.strict, true)
const webPackage = JSON.parse(read('apps/web/package.json'))
for (const name of ['typecheck', 'typecheck:app', 'typecheck:functions']) {
  assert.equal(webPackage.scripts[name].includes('--strictNullChecks false'), false, `${name}: strict-null override remains`)
}

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.public_readiness_configured_pages, 20)
assert.equal(inventory.counts.production_smoke_page_routes, 20)
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/production-smoke.yml',
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
console.log('- Phase 11 P11A through P11F are evidence-backed complete')
console.log('- P11B latest-head inventory is 89 workflows, 36 classified repeated steps, and zero cancellation gaps')
console.log('- Phase 11 P11G final pre-merge acceptance is active')
console.log('- hosted production monitoring closeout remains required after merge')
console.log('- Twitch and Kick remain separate')
