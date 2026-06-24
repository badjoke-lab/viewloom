import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }
const requireFragments = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) {
    assert(source.includes(fragment), `${path}: missing required fragment: ${fragment}`)
  }
}

const retiredNotes = [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
  'docs/work-in-progress/phase5-data-capability-audit.md',
]

const activeWatchlistNote = 'docs/work-in-progress/watchlist-v1-working-note.md'
const historyAcceptancePath = 'docs/operations/history-production-acceptance-2026-06-23.md'
const channelAcceptancePath = 'docs/operations/channel-production-acceptance-2026-06-23.md'
const outputAcceptancePath = 'docs/operations/report-export-consolidation-acceptance-2026-06-24.md'
const capabilityAuditPath = 'docs/product/next-feature-data-capability-audit.md'
const watchlistSpecPath = 'docs/product/local-watchlist-spec.md'
const watchlistPlanPath = 'docs/product/watchlist-v1-implementation-plan.md'
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
  capabilityAuditPath,
  watchlistSpecPath,
  watchlistPlanPath,
  activeWatchlistNote,
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
  requireFragments('docs/operations/development-and-deployment-policy.md', [
    'Status: source of truth',
    '`work-*`',
    '`preview-*`',
    '`main` is the production branch',
    'cancel-in-progress: true',
    'Do not collapse these into one claim',
    'Twitch and Kick remain separate',
  ])

  requireFragments('docs/operations/development-policy-addendum.md', [
    'Status: source of truth for documentation-first execution',
    'Last verified: 2026-06-21',
    'Preview custom include preview-*',
    'Production deployment identity and smoke: verified',
    'Active working note, if any:',
  ])

  requireFragments('docs/operations/documentation-governance.md', [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
    'Roadmap phase:',
  ])

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
    'product/next-feature-data-capability-audit.md',
    'product/local-watchlist-spec.md',
    'product/watchlist-v1-implementation-plan.md',
    'work-in-progress/watchlist-v1-working-note.md',
  ]) assert(index.includes(path), `${indexPath}: missing canonical document link: ${path}`)

  for (const retired of retiredNotes) {
    assert(!index.includes(retired.replace('docs/', '')), `${indexPath}: retired temporary note is still linked: ${retired}`)
  }

  for (const fragment of [
    'Current active note:',
    'active Local Watchlist v1 implementation ledger',
    'There is no active History rebuild, Channel v1, Report & Export consolidation, or Phase 5 capability-audit working note.',
    'pending History UI appearance revision',
    'Local Watchlist W0 is complete through PR #415.',
    'W1 storage foundation is next',
  ]) assert(index.includes(fragment), `${indexPath}: missing completed/active-state fragment: ${fragment}`)

  requireFragments('docs/product/current-roadmap.md', [
    'History & Trends | functional and production acceptance complete',
    'Channel / Streamer | v1 and production acceptance complete',
    'Report/export shared layer | R0–R4 complete through PR #413',
    'Phase 5 capability audit | complete through PR #414',
    'Local Watchlist v1 | W0 specification complete through PR #415',
    'W1 storage foundation is next; runtime not started',
    '### Phase 6 — Local Watchlist v1',
    'W0 complete through PR #415',
    'W1 next, runtime not started',
    'maximum 50 entries per provider',
    'empty list = 0 feature-data requests',
    'nonempty load = 1 Heatmap + 1 History request',
    'W1   local model, storage, and URL state',
    'History UI appearance work remains pending',
  ])

  requireFragments('docs/product/current-schedule.md', [
    'Channel production acceptance            complete',
    'Report/export R0-R4                      complete through PR #413',
    'Phase 5 data-capability audit             complete through PR #414',
    'Local Watchlist W0                       complete through PR #415',
    'Local Watchlist W1                       next, not started',
    'W1 — local state and storage foundation',
    'Branch: work-watchlist-w1-storage',
    'viewloom.watchlist.twitch.v1',
    'maximum entries:',
    '50 per provider',
    'nonempty initial list:',
    'exactly 1 provider Heatmap request',
    'Not in latest observed set',
    'Not confirmed offline',
    'Do not begin W1 before the PR #415 merge report is issued.',
  ])

  requireFragments(outputPlanPath, [
    'Status: completed implementation plan and permanent milestone record',
    'Version: 1.4-complete',
    'Closure PR: #413',
    'PR #410',
    'PR #411',
    'PR #412',
    'PR #413',
    'spreadsheetSafety: apostrophe',
    'spreadsheetSafety: none',
    'former R0 temporary audit was removed in PR #413',
  ])

  requireFragments(outputAcceptancePath, [
    'Status: completed permanent record on PR #413 merge',
    'Closure PR: #413',
    '46cea2eceff85b4f5a359446d102d7bc6afe3487',
    '6b90c277460a674e355a7676444ddf10ff296325',
    '9bd7df7620c87c48e5c2d2834cfdce712ad71e3e',
    '83a46d286c90a9be503d7110b71b382f0394288e',
    'viewloom-history-export-v1',
    'viewloom-channel-v1',
    'Phase 4 created a reusable neutral output layer',
  ])

  requireFragments(capabilityAuditPath, [
    'Status: completed permanent audit record on PR #414 merge',
    'Closure PR: #414',
    'Provider-specific, login-free Local Watchlist v1',
    'Session page as an exact session-history product',
    'one latest Heatmap request',
    'one History request',
    'Not in latest observed set',
    'No per-channel server request is required.',
    'Local Watchlist v1 is approved',
  ])

  requireFragments(watchlistSpecPath, [
    'Status: active permanent product specification',
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    'Heatmap requests: 0',
    'Heatmap requests: exactly 1',
    'History requests: exactly 1',
    'Not in latest observed set',
    'Not confirmed offline',
    'Not in retained History result',
    'No complete history is implied',
    'Save to Watchlist',
    'Saved in Watchlist',
    '<meta name="robots" content="noindex,follow">',
    'no per-channel request loop',
    'Watchlist is a secondary utility surface, not a sixth primary visualization',
  ])

  requireFragments(watchlistPlanPath, [
    'Status: active implementation plan',
    'work-watchlist-w1-storage',
    'work-watchlist-w2a-latest',
    'work-watchlist-w2b-history',
    'work-watchlist-w3a-routes',
    'work-watchlist-w3b-ui',
    'work-watchlist-w3c-candidate',
    'work-watchlist-w4-contracts',
    'work-watchlist-w4-browser',
    'work-watchlist-w5-hosted',
    'preview-watchlist-v1',
    'work-watchlist-w5-production',
    'No public Watchlist route is added in W1.',
    'empty list -> zero Heatmap and zero History requests',
    'nonempty initial load -> one Heatmap plus one History request',
    'After each PR merge:',
  ])

  requireFragments(activeWatchlistNote, [
    'Status: active W0 specification work',
    'Roadmap phase: Phase 6 — Local Watchlist v1',
    'Branch: `work-watchlist-w0`',
    'No Watchlist runtime implementation begins until W0 merges',
  ])

  requireFragments(sharedOutputContractPath, [
    'Status: active Phase 4 R1 contract',
    'spreadsheet formula protection is opt-in',
    'numeric strings are not coerced',
    'the helper returns a neutral operation result',
  ])

  requireFragments(historyOutputContractPath, [
    'Status: active Phase 4 R2 contract',
    'viewloom-history-export-v1',
    'CSV CRLF line endings',
    '1000 ms object-URL revoke delay',
    'report copy fallback behavior',
  ])

  requireFragments(channelOutputContractPath, [
    'Status: active Phase 4 R3 contract',
    'viewloom-channel-v1',
    'CSV UTF-8 BOM at download time',
    'no implicit spreadsheet formula protection',
    'zero-millisecond object-URL revoke timing',
    'exactly one provider History request per loaded period',
  ])

  requireFragments('docs/product/history-and-trends-spec.md', [
    'Status: accepted production product specification',
    'Overview',
    'Archives',
    'Report & Export',
    'Accepted implementation record',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
  ])

  requireFragments('docs/product/history-layout-rebuild-plan.md', [
    'Status: completed implementation plan and permanent milestone record',
    'H1 — History view-state and shell contract',
    'H7 — Cloudflare Preview, production acceptance, and document cleanup',
    'This plan is complete and is retained as the implementation record.',
  ])

  requireFragments(historyAcceptancePath, [
    'Status: completed permanent record',
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
    '27998433929',
    '27999024838',
    '7810348478',
  ])

  requireFragments(channelSpecPath, [
    'Status: accepted production product specification',
    'Overview',
    'Retained Days',
    'Report & Export',
    'Default visible count:',
    '```text\n6\n```',
    'noindex,follow',
    'Not confirmed offline',
    'accepted production SHA: efc14295f0a372b96afac740d6a01571f7582210',
  ])

  requireFragments(channelPlanPath, [
    'Status: completed implementation plan and permanent milestone record',
    'C2A — state, URL, payload, and one-request foundation',
    'C5B — Preview, production acceptance, and closure',
    'preview-channel-v1',
    'This plan is complete and retained as the implementation record.',
  ])

  requireFragments(channelAcceptancePath, [
    'Status: completed permanent record',
    'efc14295f0a372b96afac740d6a01571f7582210',
    '28027105615',
    '7821161692',
    '28028685856',
    '7821826483',
  ])

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

  requireFragments('.github/pull_request_template.md', [
    '## Governing documents',
    'Roadmap phase:',
    'Schedule window:',
    'Active working note, if any:',
    'Unnecessary Cloudflare Preview deployments were not requested',
    'Full required checks were run on the latest completed candidate HEAD',
    'Required manual visual acceptance passed',
    'Completed temporary working notes were deleted and unlinked',
  ])
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
console.log('- completed History, Channel, Report & Export, and Phase 5 working notes remain retired')
console.log('- active Watchlist v1 working note is governed through W5')
console.log('- Watchlist W0 is complete through PR #415; W1 storage foundation is next')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
