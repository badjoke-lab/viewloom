import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const triggerPath = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json'
const contractPath = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json'
const packageAllowed = new Set([
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  contractPath,
  'docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/run-12a4-kick-canary-expiry-binding-cleanup.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
  'scripts/verify-development-policy.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
])
const retirementAllowed = new Set([
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  contractPath,
  triggerPath,
  'docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
])

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const trigger = existsSync(triggerPath) ? JSON.parse(readFileSync(triggerPath, 'utf8')) : null
const retirement = contract.status === 'accepted_and_retired'
  && trigger?.status === 'consumed_and_retired'
  && trigger?.retired === true

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const triggerChanged = changed.includes(triggerPath)
const activeAllowed = retirement ? retirementAllowed : packageAllowed
const unexpected = retirement
  ? changed.filter((file) => !activeAllowed.has(file))
  : triggerChanged
    ? changed.filter((file) => file !== triggerPath)
    : changed.filter((file) => !activeAllowed.has(file))
const forbidden = changed.filter((file) =>
  file.startsWith('workers/collector-twitch/')
  || file.startsWith('apps/web/')
  || file.startsWith('db/')
  || file === 'workers/collector-kick/wrangler.toml'
  || file === 'workers/collector-kick/wrangler.category-canary.toml')

if (!existsSync(triggerPath)) {
  console.error(JSON.stringify({ ok: false, reason: 'cleanup_trigger_missing', changed }, null, 2))
  process.exit(1)
}
if (unexpected.length || forbidden.length) {
  console.error(JSON.stringify({
    ok: false,
    mode: retirement ? 'retirement' : triggerChanged ? 'exact_trigger' : 'dormant_package',
    changed,
    unexpected,
    forbidden,
  }, null, 2))
  process.exit(1)
}
if (!retirement && triggerChanged && changed.length !== 1) {
  console.error(JSON.stringify({ ok: false, reason: 'cleanup_trigger_must_be_exact_one_file', changed }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  mode: retirement ? 'retirement' : triggerChanged ? 'exact_trigger' : 'dormant_package',
  changed,
  productionFilesChanged: 0,
  twitchChanged: false,
}, null, 2))
