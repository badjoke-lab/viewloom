import { execFileSync } from 'node:child_process'

const triggerPath = 'docs/audits/12a4-category-execution-cost-probe-trigger.json'
const allowed = new Set([triggerPath])

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'

try {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
  const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)

  if (!changed.includes(triggerPath)) {
    const delegated = execFileSync(
      process.execPath,
      ['scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs'],
      { encoding: 'utf8', env: process.env },
    )
    console.log(JSON.stringify({
      ok: true,
      mode: 'execution_package_scope',
      triggerFilePresentButUnchanged: true,
      delegated: JSON.parse(delegated),
    }, null, 2))
    process.exit(0)
  }

  const unexpected = changed.filter((file) => !allowed.has(file))
  if (changed.length !== 1 || unexpected.length) {
    console.error(JSON.stringify({ ok: false, changed, unexpected, allowed: [...allowed] }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, mode: 'one_file_trigger_scope', changed }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
