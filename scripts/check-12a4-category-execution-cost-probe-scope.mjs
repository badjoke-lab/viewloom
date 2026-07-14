import { execFileSync } from 'node:child_process'

const allowed = [
  '.github/workflows/analytics-12a4-category-execution-cost-probe.yml',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-category-execution-cost-probe-contract.json',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
  'scripts/check-12a4-category-execution-cost-probe-scope.mjs',
  'scripts/test-12a4-category-execution-cost-probe.py',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-development-policy.mjs',
  'workers/category-cost-probe/src/index.ts',
  'workers/category-cost-probe/wrangler.twitch.toml',
  'workers/category-cost-probe/wrangler.kick.toml',
]

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'
let changed = []
try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
} catch (error) {
  console.error(`scope check failed to resolve diff: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const unexpected = changed.filter((file) => !allowed.includes(file))
if (unexpected.length) {
  console.error(JSON.stringify({ ok: false, unexpected, allowed }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, changed }, null, 2))
