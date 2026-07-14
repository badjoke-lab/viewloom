import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-category-controlled-schema-apply.yml',
  '.github/workflows/analytics-12a4-category-readonly-preflight.yml',
  '.github/workflows/analytics-12a4-category-readonly-preflight-acceptance.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe.yml',
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-category-execution-cost-probe-contract.json',
  'docs/audits/12a4-category-readonly-preflight-trigger.json',
  'docs/audits/12a4-category-controlled-schema-apply-contract.json',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-readonly-preflight-acceptance.md',
  'docs/work-in-progress/phase12a4-category-controlled-schema-apply.md',
  'scripts/check-12a4-category-controlled-schema-apply-scope.mjs',
  'scripts/test-12a4-category-controlled-schema-apply.py',
  'scripts/verify-12a4-category-controlled-schema-apply.mjs',
  'scripts/verify-12a4-category-readonly-preflight-package.mjs',
  'scripts/verify-12a4-category-readonly-preflight-acceptance-package.mjs',
  'scripts/verify-development-policy.mjs',
  'workers/shared/category-schema.ts',
])

const allowedPrefixes = [
  'workers/category-schema-apply/',
]

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
  const unexpected = changed.filter((file) => !allowed.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix)))
  if (unexpected.length) {
    console.error(JSON.stringify({ ok: false, unexpected, allowed: [...allowed], allowedPrefixes }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, changed }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
