import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-category-controlled-schema-apply-acceptance.yml',
  'docs/audits/12a4-category-controlled-schema-apply-acceptance-contract.json',
  'docs/audits/12a4-category-controlled-schema-apply-evidence.json',
  'docs/work-in-progress/phase12a4-category-controlled-schema-apply-acceptance.md',
  'scripts/check-12a4-category-controlled-schema-apply-acceptance-scope.mjs',
  'scripts/verify-12a4-category-controlled-schema-apply-acceptance-package.mjs',
])

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n').map((value) => value.trim()).filter(Boolean)
  const unexpected = changed.filter((file) => !allowed.has(file))
  if (unexpected.length) {
    console.error(JSON.stringify({ ok: false, unexpected, allowed: [...allowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, changed }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
