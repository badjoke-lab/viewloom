import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`)
}
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}
const forbid = (path, fragments) => {
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (source.includes(fragment)) failures.push(`${path}: stale fragment remains: ${fragment}`)
}

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
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/localization-spec.md',
  'docs/product/localization-implementation-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/P8B_SCOPE.md',
  'docs/audits/public-browser-defects.json',
  'docs/audits/history-ui-h0-baseline.md',
  'docs/audits/history-ui-h0-owner-map.json',
  'docs/audits/history-ui-h0-source-map.md',
  'docs/audits/history-ui-h0-findings.md',
  'scripts/verify-public-browser-audit.mjs',
  'scripts/verify-history-ui-h0-baseline.mjs',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  '.github/pull_request_template.md',
]
for (const path of requiredFiles) needFile(path)

for (const path of [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
  'docs/work-in-progress/phase5-data-capability-audit.md',
  'docs/work-in-progress/watchlist-v1-working-note.md',
  'docs/work-in-progress/watchlist-w5a-hosted-preview-note.md',
  'docs/work-in-progress/watchlist-w5b-production-note.md',
]) if (existsSync(join(root, path))) failures.push(`Retired note must remain deleted: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth',
  '`work-*`',
  '`preview-*`',
  '`main` is the production branch',
  'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory',
  'Temporary-note lifecycle',
])

for (const path of ['README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'P9H0',
  'PR #430',
  'PR #432',
  'work-history-ui-h1-metric',
])

need('docs/product/current-roadmap.md', [
  'P9H0 closeout complete PR #432',
  'Active implementation branch: none',
  'work-history-ui-h1-metric',
  'P9H1 has not been created.',
  'English/Japanese localization',
  'Spanish/pt-BR localization',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H0 documentation closeout              complete PR #432',
  'Active implementation branch             none',
  'work-history-ui-h1-metric',
  'P9H1 branch created                      no',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.1',
  'Current implementation branch: none',
  'Completed closeout: PR #432',
  'work-history-ui-h1-metric',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 1.5',
  'Completed closeout: PR #432',
  'Current implementation branch: none',
  'work-history-ui-h1-metric',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed documentation closeout: PR #432',
  'Current implementation branch: none',
  'work-history-ui-h1-metric',
])

need('docs/product/cross-site-quality-remediation-spec.md', [
  'Status: approved future permanent specification',
  'Roadmap phases: Phase 10–11',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'U10A work-quality-u10a-baseline',
  'O11G work-operations-o11g-acceptance',
])
need('docs/product/localization-spec.md', [
  'en     English source language',
  'ja     Japanese',
  'es     Spanish',
  'pt-BR  Brazilian Portuguese',
  'Existing English URLs remain unchanged and canonical',
])
need('docs/product/localization-implementation-plan.md', [
  'I13A work-i18n-i13a-contract',
  'I14C work-i18n-i14c-acceptance',
])

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'README.md',
  'docs/README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
]) forbid(path, [
  'Current branch: work-p9h0-closeout',
  'Current closeout branch: work-p9h0-closeout',
  'P9H0 closeout active on work-p9h0-closeout',
  'Current window: P9H0 documentation closeout',
])

const ownerMap = JSON.parse(read('docs/audits/history-ui-h0-owner-map.json'))
if (ownerMap.status !== 'complete') failures.push('P9H0 owner map must remain complete')
if (ownerMap.next_branch !== 'work-history-ui-h1-metric') failures.push('P9H0 owner map next branch changed')

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
if (ledger.status !== 'complete') failures.push('P8B ledger must remain complete')
if (ledger.counts?.p1 !== 3 || ledger.counts?.p2 !== 5) failures.push('P8B classification changed')

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development and documentation policy verification passed.')
console.log('- P9H0 and its closeout are complete through PR #430 and PR #432')
console.log('- there is no active implementation branch')
console.log('- work-history-ui-h1-metric is next but has not been created')
console.log('- Phase 10-14 quality and localization authorities are registered but not active')
console.log('- Phase 16 remains unapproved')