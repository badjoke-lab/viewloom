import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const allowed = new Set([
  '.github/workflows/analytics-12a4-category-readonly-preflight.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml',
  '.github/workflows/analytics-12a4-category-capture-enablement-decision.yml',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-category-execution-cost-probe-execution-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
  'docs/audits/12a4-category-capture-enablement-decision-contract.json',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-capture-enablement-decision.md',
  'scripts/check-12a4-category-capture-enablement-decision-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-trigger-scope.mjs',
  'scripts/collect-12a4-category-execution-cost-probe-evidence.mjs',
  'scripts/run-12a4-category-execution-cost-probe-provider.mjs',
  'scripts/test-12a4-category-execution-cost-probe-evidence.mjs',
  'scripts/test-12a4-category-execution-cost-probe-runner.mjs',
  'scripts/verify-12a4-category-capture-enablement-decision.mjs',
  'scripts/verify-12a4-category-execution-cost-probe-evidence.mjs',
  'scripts/verify-12a4-category-execution-cost-probe-execution-package.mjs',
  'scripts/verify-12a4-category-execution-cost-probe-provider-result.mjs',
  'scripts/verify-12a4-category-execution-cost-probe-trigger.mjs',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-12a4-category-readonly-preflight-package.mjs',
  'scripts/verify-development-policy.mjs',
  'workers/category-cost-probe/src/index.ts',
])

const canonicalSyncAllowed = new Set([
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-kick-category-capture-canary-execution-contract.json',
  'docs/work-in-progress/phase12a4-category-capture-enablement-decision.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-execution.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary.md',
  'scripts/check-12a4-category-capture-enablement-decision-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/verify-12a4-category-capture-enablement-decision.mjs',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
  'scripts/verify-development-policy.mjs',
])

const isCanonicalSync = (() => {
  try {
    const gate = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))
    return gate.schemaVersion === 'viewloom-12a2-current-gate-state-v17'
      && gate.status === '12a4_kick_canary_execution_accepted_exact_trigger_current'
      && gate.currentWorkstream?.phase === '12A-4-10'
      && gate.categoryCapture?.kickCanaryPackageAccepted === true
      && gate.categoryCapture?.kickCanaryExecutionPackageAccepted === true
      && gate.categoryCapture?.kickExactTriggerAccepted === false
      && gate.categoryCapture?.runtimeCaptureAuthorized === false
      && !existsSync('docs/audits/12a4-kick-category-capture-canary-trigger.json')
  } catch {
    return false
  }
})()

const activeAllowed = isCanonicalSync ? new Set([...allowed, ...canonicalSyncAllowed]) : allowed
const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
  const unexpected = changed.filter((file) => !activeAllowed.has(file))
  if (unexpected.length) {
    console.error(JSON.stringify({ ok: false, canonicalSync: isCanonicalSync, changed, unexpected, allowed: [...activeAllowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, canonicalSync: isCanonicalSync, changed }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
