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
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/u10g-architecture.md',
  'docs/work-in-progress/u10h-acceptance.md',
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/phase11-strict-null-baseline.json',
  'docs/audits/phase11-ci-ownership-baseline.json',
  'scripts/measure-phase11-strict-null-baseline.mjs',
  'scripts/verify-phase11-strict-null-baseline.mjs',
  'scripts/measure-phase11-ci-ownership.mjs',
  'scripts/verify-phase11-ci-ownership.mjs',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10g-architecture.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
  '.github/workflows/phase11-strict-null-baseline.yml',
  '.github/workflows/phase11-ci-ownership.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

check('README.md', [
  'U10H canonical closeout               complete PR #472',
  'Phase 11 acceptance and operations    active',
  'Active implementation branch          work-quality-phase11-acceptance-operations',
  'Current workstream                    P11A strict-null baseline',
])
check('docs/README.md', [
  'U10H canonical closeout                          complete PR #472',
  'Phase 11 acceptance and operations               active',
  'Active implementation branch                    work-quality-phase11-acceptance-operations',
  'Current workstream                               P11A strict-null baseline',
])
check('AGENTS.md', [
  'Phase 11 acceptance and operations active',
  'Active implementation branch: work-quality-phase11-acceptance-operations',
  'Current workstream: P11A strict-null baseline',
])
check('CONTRIBUTING.md', [
  'Phase 11 acceptance and operations active',
  'Active implementation branch: work-quality-phase11-acceptance-operations',
  'Current workstream: P11A strict-null baseline',
])
check('docs/product/current-roadmap.md', [
  'Phase 11 acceptance and operations active',
  'Active implementation branch: work-quality-phase11-acceptance-operations',
  'Current workstream: P11A strict-null baseline',
])
check('docs/product/current-schedule.md', [
  'Phase 11 acceptance and operations active',
  'Active branch: work-quality-phase11-acceptance-operations',
  'P11A strict-null scopes: app / functions',
])
check('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 11 — acceptance and operations',
  'Current implementation branch: `work-quality-phase11-acceptance-operations`',
  'Current workstream: P11A strict-null baseline',
])
check('docs/product/cross-site-quality-remediation-plan.md', [
  'Current branch: `work-quality-phase11-acceptance-operations`',
  'Active phase: Phase 11 acceptance and operations',
  'Current workstream: P11A strict-null baseline',
])

check('docs/work-in-progress/phase11-acceptance-operations.md', [
  'Status: active',
  'Branch: `work-quality-phase11-acceptance-operations`',
  'P11A strict-null baseline and staged type-safety migration',
  'P11B CI ownership and duplication audit',
  'P11C deployment identity, provider status, freshness, and capacity monitoring contract',
  'P11D failure runbooks and escalation ownership',
  'P11E weekly / monthly / quarterly maintenance cadence',
])

check('docs/operations/u10h-production-acceptance-2026-07-04.md', [
  'Status: complete',
  'Workflow run: 28701464391',
  'Artifact id: 8080315127',
  'Result: pass',
])

const strictBaseline = JSON.parse(read('docs/audits/phase11-strict-null-baseline.json'))
assert.equal(strictBaseline.status, 'remediation-complete')
assert.equal(strictBaseline.baseline.scopes.app.error_count, 22)
assert.equal(strictBaseline.baseline.scopes.app.affected_file_count, 10)
assert.equal(strictBaseline.baseline.scopes.functions.error_count, 0)
assert.equal(strictBaseline.remediation.scopes.app.error_count, 0)
assert.equal(strictBaseline.remediation.scopes.app.status, 'clean')
assert.equal(strictBaseline.remediation.scopes.functions.error_count, 0)
assert.equal(strictBaseline.remediation.scopes.functions.status, 'clean')
assert.equal(strictBaseline.remediation.current_override_present, false)
assert.equal(strictBaseline.result.command_line_overrides_remaining, 0)
assert.equal(strictBaseline.result.total_errors_remaining, 0)

const baseTsconfig = JSON.parse(read('tsconfig.base.json'))
assert.equal(baseTsconfig.compilerOptions.strict, true)
const webPackage = JSON.parse(read('apps/web/package.json'))
for (const name of ['typecheck', 'typecheck:app', 'typecheck:functions']) {
  assert.equal(webPackage.scripts[name].includes('--strictNullChecks false'), false, `${name}: strict-null override remains`)
}
assert.ok(webPackage.scripts.typecheck.includes('tsconfig.json --noEmit'))
assert.ok(webPackage.scripts.typecheck.includes('tsconfig.functions.json --noEmit'))

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.public_readiness_configured_pages, 20)
assert.equal(inventory.counts.production_smoke_page_routes, 20)
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10g-architecture.yml',
  '.github/workflows/quality-u10h-acceptance.yml',
  '.github/workflows/phase11-strict-null-baseline.yml',
  '.github/workflows/phase11-ci-ownership.yml',
]) {
  const source = read(path)
  assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

console.log('ViewLoom development and documentation verification passed.')
console.log('- Phase 10 is complete through U10H closeout')
console.log('- Phase 11 acceptance and operations is active')
console.log('- P11A strict-null remediation is complete: App clean, Functions clean')
console.log('- App and Functions strict-null overrides are removed')
console.log('- Twitch and Kick remain separate')
