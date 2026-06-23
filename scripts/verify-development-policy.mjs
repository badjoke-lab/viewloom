import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const completedHistoryWorkingNote = 'docs/work-in-progress/history-layout-rebuild-working-note.md'
const activeChannelAudit = 'docs/work-in-progress/channel-v1-audit.md'
const channelSpecPath = 'docs/product/channel-and-streamer-spec.md'
const channelPlanPath = 'docs/product/channel-v1-implementation-plan.md'
const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/history-production-acceptance-2026-06-23.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  channelSpecPath,
  channelPlanPath,
  activeChannelAudit,
  '.github/pull_request_template.md',
  '.github/workflows/development-policy.yml',
]

for (const path of requiredFiles) assert(existsSync(join(root, path)), `Missing required policy/document file: ${path}`)
assert(!existsSync(join(root, completedHistoryWorkingNote)), `Completed History working note must remain deleted: ${completedHistoryWorkingNote}`)

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
    'operations/history-production-acceptance-2026-06-23.md',
    'product/current-roadmap.md',
    'product/current-schedule.md',
    'product/history-and-trends-spec.md',
    'product/history-layout-rebuild-plan.md',
    'product/channel-and-streamer-spec.md',
    'product/channel-v1-implementation-plan.md',
    'work-in-progress/channel-v1-audit.md',
  ]) assert(index.includes(path), `${indexPath}: missing canonical document link: ${path}`)
  assert(!index.includes(completedHistoryWorkingNote.replace('docs/', '')), `${indexPath}: completed History working note is still linked.`)
  assert(index.includes('There is no active History rebuild working note.'), `${indexPath}: completed History working-note state is not recorded.`)
  assert(index.includes('The Channel audit note is temporary.'), `${indexPath}: active Channel audit lifecycle is not recorded.`)

  const governance = read('docs/operations/documentation-governance.md')
  for (const fragment of [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
    'Roadmap phase:',
  ]) assert(governance.includes(fragment), `documentation-governance.md: missing ${fragment}`)

  const roadmap = read('docs/product/current-roadmap.md')
  for (const fragment of [
    'History & Trends | layout rebuild and production acceptance complete',
    'Phase 3 — Channel / Streamer v1 completion',
    'Phase 5 — next-feature data-capability audit',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
  ]) assert(roadmap.includes(fragment), `current-roadmap.md: missing ${fragment}`)

  const schedule = read('docs/product/current-schedule.md')
  for (const fragment of [
    'History production acceptance H7     complete',
    'Channel C0 audit                      complete through PR #398',
    'C1 — permanent specification and implementation plan',
    'C2A — Channel state, URL, popstate, and one-request foundation',
    'work-channel-c2-state',
  ]) assert(schedule.includes(fragment), `current-schedule.md: missing ${fragment}`)

  const historySpec = read('docs/product/history-and-trends-spec.md')
  for (const fragment of [
    'Status: accepted production product specification',
    'Overview',
    'Archives',
    'Report & Export',
    'Accepted implementation record',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
  ]) assert(historySpec.includes(fragment), `history-and-trends-spec.md: missing ${fragment}`)

  const historyPlan = read('docs/product/history-layout-rebuild-plan.md')
  for (const fragment of [
    'Status: completed implementation plan and permanent milestone record',
    'H1 — History view-state and shell contract',
    'H7 — Cloudflare Preview, production acceptance, and document cleanup',
    'This plan is complete and is retained as the implementation record.',
  ]) assert(historyPlan.includes(fragment), `history-layout-rebuild-plan.md: missing ${fragment}`)

  const acceptancePath = 'docs/operations/history-production-acceptance-2026-06-23.md'
  const acceptance = read(acceptancePath)
  for (const fragment of [
    'Status: completed permanent record',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
    '27998433929',
    '27999024838',
    '7810348478',
  ]) assert(acceptance.includes(fragment), `${acceptancePath}: missing ${fragment}`)

  const channelAudit = read(activeChannelAudit)
  for (const fragment of [
    'Status: active temporary note',
    'retained daily Top 10 ranking footprint',
    'Not confirmed offline',
    'What the current data cannot prove',
    'C1 specification',
    'no Channel runtime behavior changes',
    '28004912659',
    '7812384078',
    'C0 state: completed in PR #398',
  ]) assert(channelAudit.includes(fragment), `${activeChannelAudit}: missing ${fragment}`)

  const channelSpec = read(channelSpecPath)
  for (const fragment of [
    'Status: permanent product specification',
    'Overview',
    'Retained Days',
    'Report & Export',
    'Default visible count:',
    '```text\n6\n```',
    'noindex,follow',
    'Not confirmed offline',
    'deliberate `preview-*` branch',
  ]) assert(channelSpec.includes(fragment), `${channelSpecPath}: missing ${fragment}`)

  const channelPlan = read(channelPlanPath)
  for (const fragment of [
    'Status: active implementation plan',
    'C2A — module and state foundation',
    'C5B — Cloudflare Preview, production acceptance, and documentation closure',
    'work-channel-c2-state',
    'preview-channel-v1',
    '10–15 focused workdays',
  ]) assert(channelPlan.includes(fragment), `${channelPlanPath}: missing ${fragment}`)

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
console.log('- completed History working note remains retired')
console.log('- permanent Channel v1 specification and implementation plan are governed')
console.log('- completed Channel C0 audit remains active as the implementation note')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
