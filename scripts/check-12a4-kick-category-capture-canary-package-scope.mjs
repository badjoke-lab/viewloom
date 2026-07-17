import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const allowed = new Set([
  '.github/workflows/analytics-12a4-kick-category-capture-canary-package.yml',
  'docs/audits/12a4-kick-category-capture-canary-package-contract.json',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary.md',
  'scripts/check-12a4-category-migration-runtime-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/test-12a4-kick-category-capture-canary.py',
  'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
  'workers/collector-kick/src/entry-category-canary.ts',
  'workers/collector-kick/wrangler.category-canary.toml',
  'workers/shared/category-capture.ts',
])

const canonicalSyncAllowed = new Set([
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'scripts/check-12a4-category-capture-enablement-decision-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/verify-12a4-category-capture-enablement-decision.mjs',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
  'scripts/verify-development-policy.mjs',
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json',
  'docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/run-12a4-kick-canary-expiry-binding-cleanup.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
])

const forbiddenPrefixes = ['workers/collector-twitch/', 'apps/web/', 'db/']

const isCanonicalSync = (() => {
  try {
    const gate = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))
    const trigger = JSON.parse(readFileSync('docs/audits/12a4-kick-category-capture-canary-trigger.json', 'utf8'))
    return gate.schemaVersion === 'viewloom-12a2-current-gate-state-v18'
      && gate.status === '12a4_kick_canary_initial_checkpoint_accepted_observation_active'
      && gate.currentWorkstream?.phase === '12A-4-11'
      && gate.categoryCapture?.kickCanaryPackageAccepted === true
      && gate.categoryCapture?.kickCanaryExecutionPackageAccepted === true
      && gate.categoryCapture?.kickExactTriggerAccepted === true
      && gate.categoryCapture?.kickCanaryExecuted === true
      && gate.categoryCapture?.kickCanaryInitialAcceptanceAccepted === true
      && gate.categoryCapture?.runtimeCaptureAuthorized === false
      && existsSync('docs/audits/12a4-kick-category-capture-canary-trigger.json')
      && trigger.attempt === 3
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
  const forbidden = changed.filter((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))
  if (unexpected.length || forbidden.length) {
    console.error(JSON.stringify({ ok: false, canonicalSync: isCanonicalSync, changed, unexpected, forbidden, allowed: [...activeAllowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, canonicalSync: isCanonicalSync, changed, forbidden: [] }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
