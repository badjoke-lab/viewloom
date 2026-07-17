import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-package.yml',
  'docs/audits/12a4-twitch-category-capture-canary-package-contract.json',
  'docs/work-in-progress/phase12a4-twitch-category-capture-canary.md',
  'scripts/check-12a4-twitch-category-capture-canary-package-scope.mjs',
  'scripts/test-12a4-twitch-category-capture-canary.py',
  'scripts/verify-12a4-twitch-category-capture-canary-package.mjs',
  'workers/collector-twitch/src/entry-category-canary.ts',
  'workers/collector-twitch/wrangler.category-canary.toml',
])
const forbidden = new Set([
  'workers/collector-twitch/wrangler.toml',
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
  const productionChanges = changed.filter((file) => forbidden.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))

  if (unexpected.length || productionChanges.length) {
    console.error(JSON.stringify({
      ok: false,
      changed,
      unexpected,
      productionChanges,
      allowed: [...allowed],
    }, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify({
    ok: true,
    changed,
    exactPackageFiles: changed.length,
    normalTwitchConfigChanged: false,
    kickChanged: false,
    productionExecutionIncluded: false,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
