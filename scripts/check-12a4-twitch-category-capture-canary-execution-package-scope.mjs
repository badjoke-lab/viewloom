import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const triggerPath = 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
const allowed = new Set([
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-execution.yml',
  'docs/audits/12a4-twitch-category-capture-canary-execution-contract.json',
  'docs/work-in-progress/phase12a4-twitch-category-capture-canary-execution.md',
  'scripts/check-12a4-twitch-category-capture-canary-execution-package-scope.mjs',
  'scripts/inspect-12a4-twitch-category-capture-canary-trigger.mjs',
  'scripts/run-12a4-twitch-category-capture-canary-execution.mjs',
  'scripts/run-12a4-twitch-category-capture-canary-storage-preflight.mjs',
  'scripts/wait-12a4-twitch-category-capture-canary-start.mjs',
  'scripts/test-12a4-twitch-category-capture-canary-execution.mjs',
  'scripts/verify-12a4-twitch-category-capture-canary-execution-package.mjs',
])
const forbiddenExact = new Set([
  triggerPath,
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-canary.toml',
  'workers/collector-twitch/src/entry-category-canary.ts',
  'workers/shared/category-capture.ts',
])
const forbiddenPrefixes = [
  'workers/collector-kick/',
  'apps/',
  'db/',
  'packages/',
]

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'origin/main'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
  const unexpected = changed.filter((file) => !allowed.has(file))
  const forbidden = changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))

  if (!existsSync(triggerPath)) {
    console.error(JSON.stringify({ ok: false, reason: 'armed_trigger_expected_but_missing' }, null, 2))
    process.exit(1)
  }
  if (unexpected.length || forbidden.length) {
    console.error(JSON.stringify({ ok: false, changed, unexpected, forbidden, allowed: [...allowed] }, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify({
    ok: true,
    changed,
    triggerPresent: true,
    triggerChanged: changed.includes(triggerPath),
    productionConfigChanged: false,
    kickChanged: false,
    productionExecutionFromPullRequest: false,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
