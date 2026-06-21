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
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  '.github/pull_request_template.md',
  '.github/workflows/development-policy.yml',
]

for (const path of requiredFiles) assert(existsSync(join(root, path)), `Missing required policy/document file: ${path}`)

if (failures.length === 0) {
  const policyPath = 'docs/operations/development-and-deployment-policy.md'
  const policy = read(policyPath)
  for (const fragment of [
    'Status: source of truth',
    '`work-*`',
    '`preview-*`',
    '`main` is the production branch',
    'cancel-in-progress: true',
    'Do not collapse these into one claim',
    'Twitch and Kick remain separate',
  ]) assert(policy.includes(fragment), `${policyPath}: missing required policy fragment: ${fragment}`)

  const addendumPath = 'docs/operations/development-policy-addendum.md'
  const addendum = read(addendumPath)
  for (const fragment of [
    'Status: source of truth for documentation-first execution',
    'Last verified: 2026-06-21',
    'Preview custom include preview-*',
    'Production deployment identity and smoke: verified',
    'Active working note, if any:',
  ]) assert(addendum.includes(fragment), `${addendumPath}: missing required addendum fragment: ${fragment}`)

  const indexPath = 'docs/README.md'
  const index = read(indexPath)
  for (const path of [
    'operations/development-and-deployment-policy.md',
    'operations/development-policy-addendum.md',
    'operations/documentation-governance.md',
    'product/current-roadmap.md',
    'product/current-schedule.md',
    'product/history-and-trends-spec.md',
    'product/history-layout-rebuild-plan.md',
    'work-in-progress/history-layout-rebuild-working-note.md',
  ]) assert(index.includes(path), `${indexPath}: missing canonical document link: ${path}`)

  const governance = read('docs/operations/documentation-governance.md')
  for (const fragment of [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
    'Roadmap phase:',
  ]) assert(governance.includes(fragment), `documentation-governance.md: missing ${fragment}`)

  const roadmap = read('docs/product/current-roadmap.md')
  for (const fragment of [
    'History information architecture and layout rebuild',
    'Channel / Streamer v1 completion',
    'data-capability audit',
  ]) assert(roadmap.includes(fragment), `current-roadmap.md: missing ${fragment}`)

  const schedule = read('docs/product/current-schedule.md')
  for (const fragment of [
    'Phase 1B — History information architecture and layout rebuild',
    'H6/H7: final QA, Preview, production acceptance',
    'temporary working note deletion',
  ]) assert(schedule.includes(fragment), `current-schedule.md: missing ${fragment}`)

  const historySpec = read('docs/product/history-and-trends-spec.md')
  for (const fragment of [
    'Overview',
    'Archives',
    'Report & Export',
    'At completion, stable implementation decisions are transferred here and the temporary working note is deleted.',
  ]) assert(historySpec.includes(fragment), `history-and-trends-spec.md: missing ${fragment}`)

  const historyPlan = read('docs/product/history-layout-rebuild-plan.md')
  for (const fragment of [
    'H1 — History view-state and shell contract',
    'H7 — Cloudflare Preview, production acceptance, and document cleanup',
    'delete `docs/work-in-progress/history-layout-rebuild-working-note.md`',
  ]) assert(historyPlan.includes(fragment), `history-layout-rebuild-plan.md: missing ${fragment}`)

  const workingNote = read('docs/work-in-progress/history-layout-rebuild-working-note.md')
  for (const fragment of [
    'Status: active temporary note',
    'Delete when:',
    'Problem inventory',
    'Deletion checklist',
  ]) assert(workingNote.includes(fragment), `history-layout-rebuild-working-note.md: missing ${fragment}`)

  for (const entryPath of ['AGENTS.md', 'CONTRIBUTING.md']) {
    const entry = read(entryPath)
    for (const path of [
      'docs/operations/development-and-deployment-policy.md',
      'docs/operations/development-policy-addendum.md',
      'docs/operations/documentation-governance.md',
      'docs/README.md',
      'docs/product/current-roadmap.md',
      'docs/product/current-schedule.md',
    ]) assert(entry.includes(path), `${entryPath}: canonical document link is missing: ${path}`)
  }

  const readme = read('README.md')
  for (const path of [
    'docs/README.md',
    'docs/product/current-roadmap.md',
    'docs/product/current-schedule.md',
  ]) assert(readme.includes(path), `README.md: canonical document link is missing: ${path}`)

  const template = read('.github/pull_request_template.md')
  for (const fragment of [
    '## Governing documents',
    'Roadmap phase:',
    'Schedule window:',
    'Active working note, if any:',
    'Unnecessary Cloudflare Preview deployments were not requested',
    'Full required checks were run on the latest completed candidate HEAD',
    'Required manual visual acceptance passed',
    'Completed temporary working notes were deleted and unlinked',
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
  '.github/workflows/history-report-text.yml',
  '.github/workflows/history-report-browser.yml',
  '.github/workflows/history-view-shell.yml',
  '.github/workflows/history-view-shell-browser.yml',
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

console.log('ViewLoom development, documentation, and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} policy/document files present`)
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
