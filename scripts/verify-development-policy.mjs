import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const retiredNotes = [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
]

const historyAcceptancePath = 'docs/operations/history-production-acceptance-2026-06-23.md'
const channelAcceptancePath = 'docs/operations/channel-production-acceptance-2026-06-23.md'
const outputAcceptancePath = 'docs/operations/report-export-consolidation-acceptance-2026-06-24.md'
const channelSpecPath = 'docs/product/channel-and-streamer-spec.md'
const channelPlanPath = 'docs/product/channel-v1-implementation-plan.md'
const outputPlanPath = 'docs/product/report-export-consolidation-plan.md'
const sharedOutputContractPath = 'apps/web/docs/shared-output-r1-contract.md'
const historyOutputContractPath = 'apps/web/docs/history-output-r2-contract.md'
const channelOutputContractPath = 'apps/web/docs/channel-output-r3-contract.md'

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  historyAcceptancePath,
  channelAcceptancePath,
  outputAcceptancePath,
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  channelSpecPath,
  channelPlanPath,
  outputPlanPath,
  sharedOutputContractPath,
  historyOutputContractPath,
  channelOutputContractPath,
  '.github/pull_request_template.md',
  '.github/workflows/development-policy.yml',
]

for (const path of requiredFiles) {
  assert(existsSync(join(root, path)), `Missing required policy/document file: ${path}`)
}

for (const path of retiredNotes) {
  assert(!existsSync(join(root, path)), `Completed temporary note must remain deleted: ${path}`)
}

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
    'operations/channel-production-acceptance-2026-06-23.md',
    'operations/report-export-consolidation-acceptance-2026-06-24.md',
    'product/current-roadmap.md',
    'product/current-schedule.md',
    'product/history-and-trends-spec.md',
    'product/history-layout-rebuild-plan.md',
    'product/channel-and-streamer-spec.md',
    'product/channel-v1-implementation-plan.md',
    'product/report-export-consolidation-plan.md',
  ]) assert(index.includes(path), `${indexPath}: missing canonical document link: ${path}`)

  for (const retired of retiredNotes) {
    assert(!index.includes(retired.replace('docs/', '')), `${indexPath}: retired temporary note is still linked: ${retired}`)
  }

  for (const fragment of [
    'There is no active History rebuild, Channel v1, or Report & Export consolidation working note.',
    'pending History UI appearance revision',
    'Phase 5 data-capability audit has not started',
  ]) assert(index.includes(fragment), `${indexPath}: missing completed/next-state fragment: ${fragment}`)

  const governance = read('docs/operations/documentation-governance.md')
  for (const fragment of [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
    'Roadmap phase:',
  ]) assert(governance.includes(fragment), `documentation-governance.md: missing ${fragment}`)

  const roadmap = read('docs/product/current-roadmap.md')
  for (const fragment of [
    'History & Trends | functional and production acceptance complete',
    'Channel / Streamer | v1 and production acceptance complete',
    'Report/export shared layer | R0–R4 complete through PR #413',
    'Phase 4 — Report & Export shared-layer consolidation',
    'State: completed through PR #413.',
    'Phase 5 — next-feature data-capability audit',
    'State: next, not started.',
    'report-export-consolidation-acceptance-2026-06-24.md',
    'History UI appearance work remains pending',
  ]) assert(roadmap.includes(fragment), `current-roadmap.md: missing ${fragment}`)

  const schedule = read('docs/product/current-schedule.md')
  for (const fragment of [
    'Channel production acceptance            complete',
    'Report/export R0 boundary audit           complete through PR #409',
    'Report/export R1 shared primitives        complete through PR #410',
    'Report/export R2 History adoption         complete through PR #411',
    'Report/export R3 Channel adoption         complete through PR #412',
    'Report/export R4 closure                  complete through PR #413',
    'Phase 5 data-capability audit              next, not started',
    'Current active implementation phase:',
    'Required first step: create a dedicated audit note before implementation',
    'work-report-export-r4-acceptance',
    'Do not begin the next PR before that report is issued.',
  ]) assert(schedule.includes(fragment), `current-schedule.md: missing ${fragment}`)

  const outputPlan = read(outputPlanPath)
  for (const fragment of [
    'Status: completed implementation plan and permanent milestone record',
    'Version: 1.4-complete',
    'Closure PR: #413',
    'Permanent acceptance:',
    'R1 contract:',
    'R2 contract:',
    'R3 contract:',
    'PR #410',
    'PR #411',
    'PR #412',
    'PR #413',
    'spreadsheetSafety: apostrophe',
    'spreadsheetSafety: none',
    'This plan is complete and retained as the permanent implementation record.',
    'former R0 temporary audit was removed in PR #413',
  ]) assert(outputPlan.includes(fragment), `${outputPlanPath}: missing ${fragment}`)

  const outputAcceptance = read(outputAcceptancePath)
  for (const fragment of [
    'Status: completed permanent record on PR #413 merge',
    'Closure PR: #413',
    '46cea2eceff85b4f5a359446d102d7bc6afe3487',
    '6b90c277460a674e355a7676444ddf10ff296325',
    '9bd7df7620c87c48e5c2d2834cfdce712ad71e3e',
    '83a46d286c90a9be503d7110b71b382f0394288e',
    'viewloom-history-export-v1',
    'viewloom-channel-v1',
    'Phase 4 created a reusable neutral output layer',
  ]) assert(outputAcceptance.includes(fragment), `${outputAcceptancePath}: missing ${fragment}`)

  const sharedOutputContract = read(sharedOutputContractPath)
  for (const fragment of [
    'Status: active Phase 4 R1 contract',
    'spreadsheet formula protection is opt-in',
    'numeric strings are not coerced',
    'the helper returns a neutral operation result',
  ]) assert(sharedOutputContract.includes(fragment), `${sharedOutputContractPath}: missing ${fragment}`)

  const historyOutputContract = read(historyOutputContractPath)
  for (const fragment of [
    'Status: active Phase 4 R2 contract',
    'viewloom-history-export-v1',
    'CSV CRLF line endings',
    '1000 ms object-URL revoke delay',
    'report copy fallback behavior',
  ]) assert(historyOutputContract.includes(fragment), `${historyOutputContractPath}: missing ${fragment}`)

  const channelOutputContract = read(channelOutputContractPath)
  for (const fragment of [
    'Status: active Phase 4 R3 contract',
    'viewloom-channel-v1',
    'CSV UTF-8 BOM at download time',
    'no implicit spreadsheet formula protection',
    'zero-millisecond object-URL revoke timing',
    'exactly one provider History request per loaded period',
  ]) assert(channelOutputContract.includes(fragment), `${channelOutputContractPath}: missing ${fragment}`)

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

  const historyAcceptance = read(historyAcceptancePath)
  for (const fragment of [
    'Status: completed permanent record',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
    '27998433929',
    '27999024838',
    '7810348478',
  ]) assert(historyAcceptance.includes(fragment), `${historyAcceptancePath}: missing ${fragment}`)

  const channelSpec = read(channelSpecPath)
  for (const fragment of [
    'Status: accepted production product specification',
    'Overview',
    'Retained Days',
    'Report & Export',
    'Default visible count:',
    '```text\n6\n```',
    'noindex,follow',
    'Not confirmed offline',
    'accepted production SHA: efc14295f0a372b96afac740d6a01571f7582210',
  ]) assert(channelSpec.includes(fragment), `${channelSpecPath}: missing ${fragment}`)

  const channelPlan = read(channelPlanPath)
  for (const fragment of [
    'Status: completed implementation plan and permanent milestone record',
    'C2A — state, URL, payload, and one-request foundation',
    'C5B — Preview, production acceptance, and closure',
    'preview-channel-v1',
    'This plan is complete and retained as the implementation record.',
  ]) assert(channelPlan.includes(fragment), `${channelPlanPath}: missing ${fragment}`)

  const channelAcceptance = read(channelAcceptancePath)
  for (const fragment of [
    'Status: completed permanent record',
    'efc14295f0a372b96afac740d6a01571f7582210',
    '28027105615',
    '7821161692',
    '28028685856',
    '7821826483',
  ]) assert(channelAcceptance.includes(fragment), `${channelAcceptancePath}: missing ${fragment}`)

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
  '.github/workflows/history-export.yml',
  '.github/workflows/history-export-browser.yml',
  '.github/workflows/history-report-export-h4.yml',
  '.github/workflows/history-report-export-h4-browser.yml',
  '.github/workflows/shared-output-r1.yml',
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
console.log('- completed History, Channel, and Report & Export working notes remain retired')
console.log('- permanent History, Channel, and Report & Export acceptance records are governed')
console.log('- Phase 4 R0-R4 are complete; Phase 5 data-capability audit is next and not started')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
