import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)
}
const requireText = (path, fragments) => {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}

for (const path of [
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
  'apps/web/scripts/history-ui-h7-hosted-acceptance.mjs',
  'apps/web/scripts/history-ui-h7-preview-trigger.json',
  'scripts/verify-history-ui-h7-evidence.mjs',
  '.github/workflows/history-ui-h7-acceptance.yml',
]) requireFile(path)

requireText('docs/product/history-ui-repair-spec.md', [
  'Status: accepted and complete',
  'exact production identity and public acceptance pass',
  'the temporary working note is deleted',
])
requireText('docs/product/history-ui-repair-plan.md', [
  'Status: complete',
  'Completed P9H7 production acceptance: PR #451',
  'Completed P9H7 canonical closeout: PR #453',
])
requireText('docs/operations/history-production-acceptance-2026-06-28.md', [
  'Status: permanent acceptance record',
  'Implementation PR: #451',
  'Closeout PR: #453',
  'Accepted production commit: `233a35ebe219c6be42723eb749e2bcc84ae7fc09`',
  'Pre-merge production: workflow 28325492470, artifact 7935573120, pass',
  'Post-merge production: workflow 28325951638, artifact 7935706617, pass',
  'Twitch observed streams: 300',
  'Kick observed streams: 100',
  'History Phase 9 is accepted in production.',
])

for (const path of [
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
]) if (existsSync(join(root, path))) issues.push(`completed temporary note still exists: ${path}`)

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

if (issues.length) {
  console.error('History UI P9H7 permanent verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}
console.log('History UI P9H7 permanent verification passed.')
console.log('- production acceptance remains permanently recorded')
console.log('- later roadmap phases do not rewrite Phase 9 evidence')
console.log('- Twitch and Kick acceptance remains separated')
