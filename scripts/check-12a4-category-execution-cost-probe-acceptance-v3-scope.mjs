import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance-v3.yml',
  'docs/audits/12a4-category-execution-cost-probe-acceptance-v3-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json',
  'scripts/check-12a4-category-execution-cost-probe-acceptance-v3-scope.mjs',
  'scripts/verify-12a4-category-execution-cost-probe-acceptance-v3-package.mjs',
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
  if (unexpected.length) {
    console.error(JSON.stringify({ ok: false, changed, unexpected, allowed: [...allowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, changed }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
