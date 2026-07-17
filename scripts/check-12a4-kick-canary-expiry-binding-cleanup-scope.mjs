import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const triggerPath = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json'
const contractPath = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json'
const canonicalSyncAllowed = new Set([
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-kick-category-capture-canary-execution-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  'scripts/check-12a4-category-capture-enablement-decision-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-post-rollback-acceptance-scope.mjs',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/verify-12a4-category-capture-enablement-decision.mjs',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-post-rollback-acceptance-package.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
  'scripts/verify-development-policy.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
])

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const cleanupTrigger = existsSync(triggerPath) ? JSON.parse(readFileSync(triggerPath, 'utf8')) : null
const gate = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))
const categoryTrigger = JSON.parse(readFileSync('docs/audits/12a4-kick-category-capture-canary-trigger.json', 'utf8'))
const evidence = JSON.parse(readFileSync('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json', 'utf8'))
const canonicalSync = contract.status === 'accepted_and_retired'
  && cleanupTrigger?.status === 'consumed_and_retired'
  && cleanupTrigger?.retired === true
  && gate.schemaVersion === 'viewloom-12a2-current-gate-state-v19'
  && gate.currentWorkstream?.phase === '12A-4-12'
  && gate.currentWorkstream?.acceptedKickCanaryFinalEvidence === true
  && categoryTrigger.status === 'consumed_and_retired'
  && categoryTrigger.retired === true
  && evidence.outcome === 'accepted'
  && evidence.artifact?.artifactId === 8399137444

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split('\n').map((value) => value.trim()).filter(Boolean)
const unexpected = canonicalSync ? changed.filter((file) => !canonicalSyncAllowed.has(file)) : changed
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
if (!canonicalSync || unexpected.length || forbidden.length) {
  console.error(JSON.stringify({ ok: false, canonicalSync, changed, unexpected, forbidden }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  mode: 'canonical_v19_final_acceptance',
  changed,
  productionFilesChanged: 0,
  twitchChanged: false,
}, null, 2))
