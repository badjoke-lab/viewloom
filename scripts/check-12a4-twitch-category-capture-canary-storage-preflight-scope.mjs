import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const workflowPath = '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml'
const reportingWorkflowPath = '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight-reporting.yml'
const evidencePath = 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json'
const requestPaths = [
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-reporting-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-diagnostic-marker.json',
]

const allowed = new Set([
  workflowPath,
  reportingWorkflowPath,
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json',
  evidencePath,
  ...requestPaths,
  'docs/work-in-progress/phase12a4-twitch-category-capture-canary-storage-preflight.md',
  'scripts/check-12a4-twitch-category-capture-canary-storage-preflight-scope.mjs',
  'scripts/verify-12a4-twitch-category-capture-canary-storage-preflight-package.mjs',
])

const forbiddenExact = new Set([
  'docs/audits/12a4-twitch-category-capture-canary-trigger.json',
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
    .sort()
  const unexpected = changed.filter((file) => !allowed.has(file))
  const forbidden = changed.filter(
    (file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
  )

  const failures = []
  if (unexpected.length) failures.push({ name: 'unexpected_files', actual: unexpected })
  if (forbidden.length) failures.push({ name: 'forbidden_files', actual: forbidden })
  if (changed.length !== allowed.size) {
    failures.push({ name: 'exact_file_count', expected: allowed.size, actual: changed.length })
  }
  for (const expected of allowed) {
    if (!changed.includes(expected)) failures.push({ name: 'missing_changed_file', actual: expected })
  }

  if (!existsSync(evidencePath)) failures.push({ name: 'accepted_evidence_missing' })
  if (existsSync(reportingWorkflowPath)) failures.push({ name: 'reporting_workflow_not_retired' })
  for (const requestPath of requestPaths) {
    if (existsSync(requestPath)) failures.push({ name: 'request_not_retired', actual: requestPath })
  }
  if (existsSync('docs/audits/12a4-twitch-category-capture-canary-trigger.json')) {
    failures.push({ name: 'twitch_trigger_must_be_absent' })
  }

  const workflow = existsSync(workflowPath) ? readFileSync(workflowPath, 'utf8') : ''
  if (!/^\s*pull_request:/m.test(workflow)) failures.push({ name: 'pull_request_validation_missing' })
  for (const forbiddenFragment of [
    /^\s*push:/m,
    /^\s*schedule:/m,
    /^\s*workflow_dispatch:/m,
    /CLOUDFLARE_API_TOKEN/,
    /CLOUDFLARE_ACCOUNT_ID/,
    /observe-readonly/,
    /observe-and-report/,
    /inspect-request/,
  ]) {
    if (forbiddenFragment.test(workflow)) {
      failures.push({ name: 'production_workflow_fragment_not_retired', actual: String(forbiddenFragment) })
    }
  }

  if (failures.length) {
    console.error(JSON.stringify({ ok: false, changed, allowed: [...allowed].sort(), failures }, null, 2))
    process.exit(1)
  }

  console.log(JSON.stringify({
    ok: true,
    changed,
    exactAcceptanceFiles: changed.length,
    evidenceFrozen: true,
    reportingWorkflowRetired: true,
    allRequestFilesRetired: true,
    productionObservationWorkflowRetired: true,
    triggerPresent: false,
    productionConfigChanged: false,
    kickChanged: false,
  }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error))
  process.exit(1)
}
