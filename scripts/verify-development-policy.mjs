import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/operations/development-and-deployment-policy.md',
  '.github/pull_request_template.md',
  '.github/workflows/development-policy.yml',
]

for (const path of requiredFiles) assert(existsSync(join(root, path)), `Missing required policy file: ${path}`)

if (failures.length === 0) {
  const policyPath = 'docs/operations/development-and-deployment-policy.md'
  const policy = read(policyPath)
  for (const fragment of [
    'Status: source of truth',
    '`work-*`',
    '`preview-*`',
    '`main` is the production branch',
    'cancel-in-progress: true',
    'Last verified: pending',
    'Do not collapse these into one claim',
    'Twitch and Kick remain separate',
  ]) assert(policy.includes(fragment), `${policyPath}: missing required policy fragment: ${fragment}`)

  for (const entryPath of ['AGENTS.md', 'CONTRIBUTING.md', 'README.md']) {
    assert(read(entryPath).includes('docs/operations/development-and-deployment-policy.md'), `${entryPath}: canonical policy link is missing.`)
  }

  const template = read('.github/pull_request_template.md')
  for (const fragment of [
    'Unnecessary Cloudflare Preview deployments were not requested',
    'Full required checks were run on the latest completed candidate HEAD',
    'Production deployment was verified separately',
    'Twitch and Kick storage, rankings, totals, and coverage claims remain separated',
  ]) assert(template.includes(fragment), `.github/pull_request_template.md: missing ${fragment}`)
}

const concurrencyWorkflows = [
  '.github/workflows/development-policy.yml',
  '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml',
  '.github/workflows/web-verification.yml',
  '.github/workflows/provider-coverage-contract.yml',
  '.github/workflows/twitch-feature-coverage-audit.yml',
  '.github/workflows/kick-coverage-ui-checks.yml',
  '.github/workflows/history-browser-gate.yml',
  '.github/workflows/history-streamer-daily-stats.yml',
  '.github/workflows/history-additional-rankings.yml',
  '.github/workflows/history-peak-archive.yml',
  '.github/workflows/history-peak-browser.yml',
  '.github/workflows/history-battle-archive.yml',
  '.github/workflows/history-battle-browser.yml',
  '.github/workflows/history-period-comparison.yml',
  '.github/workflows/history-period-comparison-browser.yml',
  '.github/workflows/channel-profile.yml',
  '.github/workflows/channel-profile-browser.yml',
  '.github/workflows/data-status-page.yml',
  '.github/workflows/data-status-browser.yml',
  '.github/workflows/platform-naming.yml',
  '.github/workflows/history-calendar-heat.yml',
  '.github/workflows/history-calendar-browser.yml',
]

for (const path of concurrencyWorkflows) {
  assert(existsSync(join(root, path)), `Missing active workflow: ${path}`)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  assert(source.includes('concurrency:'), `${path}: concurrency block is missing.`)
  assert(source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), `${path}: concurrency group is not the shared PR/ref group.`)
  assert(source.includes('cancel-in-progress: true'), `${path}: obsolete runs are not cancelled.`)
}

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} policy entry/source files present`)
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
