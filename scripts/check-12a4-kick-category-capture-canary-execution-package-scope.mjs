import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  'docs/audits/12a4-kick-category-capture-canary-execution-contract.json',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-execution.md',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/inspect-12a4-kick-category-capture-canary-trigger.mjs',
  'scripts/run-12a4-kick-category-capture-canary-execution.mjs',
  'scripts/test-12a4-kick-category-capture-canary-execution.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
])

const forbiddenPrefixes = [
  'workers/collector-twitch/',
  'apps/',
  'db/',
]
const forbiddenExact = new Set([
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
  'workers/collector-kick/src/entry-category-canary.ts',
  'workers/shared/category-capture.ts',
  'docs/audits/12a2-current-gate-state.json',
])

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
  const unexpected = changed.filter((file) => !allowed.has(file))
  const forbidden = changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))
  if (unexpected.length || forbidden.length) {
    console.error(JSON.stringify({ ok: false, changed, unexpected, forbidden, allowed: [...allowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, changed, triggerPresent: false, productionFilesChanged: 0 }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
