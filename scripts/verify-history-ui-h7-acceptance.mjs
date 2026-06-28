import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)
}
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}

for (const path of [
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
  'scripts/verify-history-ui-h7-evidence.mjs',
  'scripts/verify-history-ui-h7-acceptance.mjs',
  '.github/workflows/history-ui-h7-acceptance.yml',
]) needFile(path)

need('README.md', [
  'P9H6 local candidate               complete PR #449',
  'P9H6 canonical closeout             complete PR #450',
  'P9H7 hosted/production acceptance  active',
  'Active implementation branch        work-history-ui-h7-acceptance',
  'Preview branch                      preview-history-ui-h7-acceptance',
])
need('AGENTS.md', [
  'P9H7 active on work-history-ui-h7-acceptance',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Preview branch: preview-history-ui-h7-acceptance',
  'P9H7 is acceptance-only.',
])
need('CONTRIBUTING.md', [
  'P9H7 active on work-history-ui-h7-acceptance',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Preview branch: preview-history-ui-h7-acceptance',
])
need('docs/README.md', [
  'P9H7     work-history-ui-h7-acceptance                   active',
  'Active implementation branch                            work-history-ui-h7-acceptance',
  'Preview branch                                          preview-history-ui-h7-acceptance',
  'history-ui-h7-hosted-acceptance.mjs',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H7 active',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Preview branch: preview-history-ui-h7-acceptance',
  'Phase 10 cross-site repair blocked until P9H7 closure',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H7 Hosted and production acceptance    active',
  'Active implementation branch             work-history-ui-h7-acceptance',
  'Preview branch                           preview-history-ui-h7-acceptance',
  'viewloom-history-ui-h6-candidate-v1',
  '1440 / 820 / 390 / 360',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 3.3',
  'Current phase: Phase 9 — P9H7 hosted and production acceptance',
  'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-spec.md', [
  'exact production identity and public acceptance pass',
  'the temporary working note is deleted',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 2.7',
  'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Active P9H7 — Hosted and production acceptance',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'P9H7 active',
  'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Evidence schema: viewloom-history-ui-h7-hosted-acceptance-v1',
])
need('docs/work-in-progress/p9h7-acceptance.md', [
  'Status: active',
  'Starting main SHA a2d641958c0068b818218d9e6080b2b3b5ee9e72',
  'Preview sequencing exception',
  'only the exact final work-branch HEAD may be moved to the Preview ref',
  'No History UI feature, API, D1 schema, collector, cron, retention, binding, primary metric, archive type, provider mixing, localization runtime, or output schema change is authorized.',
])
need('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs', [
  "schema: 'viewloom-history-ui-h7-hosted-acceptance-v1'",
  "phase: 'P9H7'",
  "last?.environment === expectedEnvironment",
  "last?.branch === expectedBranch",
  "last?.commit_sha === expectedSha",
  "payload?.source === 'real'",
  "binding: 'DB_TWITCH_HOT'",
  "binding: 'DB_KICK_HOT'",
  'twitch-desktop-1440-hosted',
  'kick-tablet-820-hosted',
  'kick-mobile-390-hosted',
  'twitch-mobile-360-hosted',
  'twitch-forced-colors-390-hosted',
  'task/archive switching refetched History',
  'Back/Forward refetched History',
  'first Tab did not reach History skip link',
])
need('scripts/verify-history-ui-h7-evidence.mjs', [
  'viewloom-history-ui-h7-hosted-acceptance-v1',
  "assert.equal(evidence.scenarios.length, 5)",
  "assert.equal(evidence.providers.twitch.binding, 'DB_TWITCH_HOT')",
  "assert.equal(evidence.providers.kick.binding, 'DB_KICK_HOT')",
])
need('.github/workflows/history-ui-h7-acceptance.yml', [
  'name: History UI P9H7 Acceptance',
  'preview-history-ui-h7-acceptance',
  'Run P9H7 hosted Preview acceptance',
  'Run P9H7 production acceptance',
  'history-ui-h7-preview-acceptance',
  'history-ui-h7-production-acceptance',
  'concurrency:',
  'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
  'cancel-in-progress: true',
])

const hosted = read('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs')
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) {
  if (hosted.includes(token)) issues.push(`P9H7 hosted runner contains forbidden token: ${token}`)
}

if (issues.length) {
  console.error('History UI P9H7 repository verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('History UI P9H7 repository verification passed.')
console.log('- P9H7 is active on work-history-ui-h7-acceptance')
console.log('- exact Preview and production deployment identity are required')
console.log('- Twitch and Kick real-data acceptance remains separated')
console.log('- Phase 10 remains blocked until P9H7 closure')
