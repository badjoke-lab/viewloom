import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const allowed = new Set([
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json',
  'docs/work-in-progress/phase12a4-twitch-category-capture-canary-storage-preflight.md',
  'scripts/check-12a4-twitch-category-capture-canary-storage-preflight-scope.mjs',
  'scripts/run-12a4-twitch-category-capture-canary-storage-preflight.mjs',
  'scripts/test-12a4-twitch-category-capture-canary-storage-preflight.mjs',
  'scripts/verify-12a4-twitch-category-capture-canary-storage-preflight-package.mjs',
])
const forbiddenExact = new Set([
  'docs/audits/12a4-twitch-category-capture-canary-trigger.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-canary.toml',
  'workers/collector-twitch/src/entry-category-canary.ts',
  'workers/shared/category-capture.ts',
])
const forbiddenPrefixes = ['workers/', 'apps/', 'db/', 'packages/']

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

  if (existsSync('docs/audits/12a4-twitch-category-capture-canary-trigger.json')) {
    console.error(JSON.stringify({ ok: false, reason: 'twitch_trigger_must_be_absent' }, null, 2))
    process.exit(1)
  }
  if (existsSync('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json')) {
    console.error(JSON.stringify({ ok: false, reason: 'production_evidence_must_not_be_frozen_in_package_pr' }, null, 2))
    process.exit(1)
  }
  if (unexpected.length || forbidden.length || changed.length !== allowed.size) {
    console.error(JSON.stringify({ ok: false, changed, unexpected, forbidden, expectedFiles: [...allowed] }, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify({
    ok: true,
    changed,
    exactPackageFiles: changed.length,
    requestPresent: existsSync('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json'),
    triggerPresent: false,
    productionEvidencePresent: false,
    productionObservationFromPullRequest: false,
    productionConfigChanged: false,
    kickChanged: false,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
