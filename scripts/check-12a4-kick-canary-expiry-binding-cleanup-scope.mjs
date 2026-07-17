import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const triggerPath = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json'
const packageAllowed = new Set([
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-evidence.json',
  'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/run-12a4-kick-canary-expiry-binding-cleanup.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-post-rollback-acceptance-package.mjs',
  'scripts/verify-development-policy.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
])

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const triggerChanged = changed.includes(triggerPath)
const trigger = existsSync(triggerPath) ? JSON.parse(readFileSync(triggerPath, 'utf8')) : null
const retirementSync = trigger?.status === 'consumed_and_retired' && trigger?.retired === true
const exactTriggerMode = triggerChanged && !retirementSync
const unexpected = exactTriggerMode
  ? changed.filter((file) => file !== triggerPath)
  : changed.filter((file) => !packageAllowed.has(file))
const forbidden = changed.filter((file) =>
  file.startsWith('workers/collector-twitch/')
  || file.startsWith('apps/web/')
  || file.startsWith('db/')
  || file === 'workers/collector-kick/wrangler.toml'
  || file === 'workers/collector-kick/wrangler.category-canary.toml')

if (triggerChanged && !existsSync(triggerPath)) {
  console.error(JSON.stringify({ ok: false, reason: 'cleanup_trigger_deleted', changed }, null, 2))
  process.exit(1)
}
if (unexpected.length || forbidden.length) {
  console.error(JSON.stringify({
    ok: false,
    mode: exactTriggerMode ? 'exact_trigger' : retirementSync ? 'retirement_sync' : 'dormant_package',
    changed,
    unexpected,
    forbidden,
  }, null, 2))
  process.exit(1)
}
if (exactTriggerMode && changed.length !== 1) {
  console.error(JSON.stringify({ ok: false, reason: 'cleanup_trigger_must_be_exact_one_file', changed }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  mode: exactTriggerMode ? 'exact_trigger' : retirementSync ? 'retirement_sync' : 'dormant_package',
  changed,
  productionFilesChanged: 0,
  twitchChanged: false,
}, null, 2))
