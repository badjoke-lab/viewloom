import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')

function requireFile(path) {
  if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)
}

function requireText(path, fragments) {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) {
    if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
  }
}

const files = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
  'apps/web/scripts/history-ui-h7-hosted-acceptance.mjs',
  'apps/web/scripts/history-ui-h7-preview-trigger.json',
  'scripts/verify-history-ui-h7-evidence.mjs',
  '.github/workflows/history-ui-h7-acceptance.yml',
]
for (const path of files) requireFile(path)

for (const path of ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md']) {
  requireText(path, ['work-history-ui-h7-acceptance', 'preview-history-ui-h7-acceptance', 'PR #450'])
}
requireText('docs/product/current-roadmap.md', [
  'Phase 9 P9H7 active',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Phase 10 cross-site repair blocked until P9H7 closure',
])
requireText('docs/product/current-schedule.md', [
  'P9H7 Hosted and production acceptance    active',
  '1440 / 820 / 390 / 360',
])
requireText('docs/product/post-watchlist-program-plan.md', [
  'Version: 3.3',
  'Current phase: Phase 9 — P9H7 hosted and production acceptance',
])
requireText('docs/product/history-ui-repair-spec.md', [
  'exact production identity and public acceptance pass',
  'the temporary working note is deleted',
])
requireText('docs/product/history-ui-repair-plan.md', [
  'Active P9H7 — Hosted and production acceptance',
])
requireText('docs/work-in-progress/history-ui-repair-working-note.md', [
  'P9H7 active',
  'Evidence schema: viewloom-history-ui-h7-hosted-acceptance-v1',
])
requireText('docs/work-in-progress/p9h7-acceptance.md', [
  'Preview trigger PR: #452 — never merge',
  'Controlled acceptance exception',
  'pre-merge production baseline',
  'Final exact-head workflow: 28318577620',
  'Final artifact: history-ui-h7-preview-acceptance / 7933542788',
  'Close PR #452 without merge',
])
requireText('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs', [
  "schema: 'viewloom-history-ui-h7-hosted-acceptance-v1'",
  "phase: 'P9H7'",
  "payload?.source === 'real'",
  "binding: 'DB_TWITCH_HOT'",
  "binding: 'DB_KICK_HOT'",
  'twitch-desktop-1440-hosted',
  'kick-mobile-390-hosted',
  'twitch-forced-colors-390-hosted',
])
requireText('scripts/verify-history-ui-h7-evidence.mjs', [
  'viewloom-history-ui-h7-hosted-acceptance-v1',
  'assert.equal(evidence.scenarios.length, 5)',
])
requireText('.github/workflows/history-ui-h7-acceptance.yml', [
  'name: History UI P9H7 Acceptance',
  'premerge-production-baseline:',
  'Run P9H7 pre-merge production baseline',
  'history-ui-h7-premerge-production-baseline',
  "HISTORY_H7_EXPECTED_SHA: ${{ github.event.pull_request.base.sha }}",
  "if: github.event_name == 'push' && github.ref == 'refs/heads/preview-history-ui-h7-acceptance'",
  'Run P9H7 production acceptance',
  'history-ui-h7-production-acceptance',
  'cancel-in-progress: true',
])

if (existsSync(join(root, 'apps/web/scripts/history-ui-h7-preview-trigger.json'))) {
  const trigger = JSON.parse(read('apps/web/scripts/history-ui-h7-preview-trigger.json'))
  if (trigger.schema !== 'viewloom-history-ui-h7-preview-trigger-v1') issues.push('Preview trigger schema changed')
  if (trigger.phase !== 'P9H7') issues.push('Preview trigger phase changed')
  if (trigger.implementation_pr !== 451 || trigger.preview_trigger_pr !== 452) issues.push('Preview trigger PR identity changed')
  if (trigger.preview_branch !== 'preview-history-ui-h7-acceptance') issues.push('Preview trigger branch changed')
  if (trigger.runtime_change !== false || trigger.merge_preview_pr !== false) issues.push('Preview trigger boundary changed')
}

if (existsSync(join(root, 'apps/web/scripts/history-ui-h7-hosted-acceptance.mjs'))) {
  const hosted = read('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs')
  for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) {
    if (hosted.includes(token)) issues.push(`hosted runner contains forbidden token: ${token}`)
  }
}

if (issues.length) {
  console.error('History UI P9H7 repository verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('History UI P9H7 repository verification passed.')
console.log('- P9H7 is active on work-history-ui-h7-acceptance')
console.log('- unavailable Preview is recorded as an external deployment failure')
console.log('- exact-SHA production acceptance is required before and after merge')
console.log('- Twitch and Kick real-data acceptance remains separated')
console.log('- Phase 10 remains blocked until P9H7 closure')
