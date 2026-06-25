import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`)
}
const requireFragments = (path, fragments) => {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path}: missing required fragment: ${fragment}`)
  }
}

for (const path of [
  'docs/audits/P8B_SCOPE.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'apps/web/scripts/public-browser-audit.mjs',
  '.github/workflows/public-browser-audit.yml',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/README.md',
]) requireFile(path)

const manifest = JSON.parse(read('docs/audits/public-surface-inventory.json'))
const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))

if (manifest.schema !== 'viewloom-public-surface-inventory-v1') failures.push('P8A manifest schema changed')
if (manifest.counts?.inventory_entries !== 21) failures.push('P8A inventory must retain 21 owned entries')
if (manifest.provider_invariants?.twitch_binding !== 'DB_TWITCH_HOT') failures.push('Twitch binding invariant changed')
if (manifest.provider_invariants?.kick_binding !== 'DB_KICK_HOT') failures.push('Kick binding invariant changed')
if (manifest.provider_invariants?.combined_totals_allowed !== false) failures.push('Combined totals must remain forbidden')
if (manifest.provider_invariants?.combined_rankings_allowed !== false) failures.push('Combined rankings must remain forbidden')
if ((gaps.missing_surfaces ?? []).length !== 5) failures.push('Five missing policy/disclosure routes must remain explicit')

requireFragments('docs/audits/P8B_SCOPE.md', [
  'Status: active',
  'Branch: `work-public-browser-audit`',
  '1440px',
  '820px',
  '390px',
  '360px',
  'P8B is an audit branch.',
  'work-history-ui-h0-baseline',
])

requireFragments('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  "productionOrigin",
  "localOrigin",
  'productionMatrix',
  'missingSurfaceProbes',
  'historyScenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
  'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
])

requireFragments('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit',
  'concurrency:',
  'cancel-in-progress: true',
  'Verify development policy',
  'Verify P8A inventory',
  'Run P8B public browser audit',
  'Verify P8B machine-readable evidence',
  'public-browser-audit-p8b',
])

requireFragments('docs/product/current-roadmap.md', [
  'P8B: active',
  'Current branch: work-public-browser-audit',
  'Exact next branch: work-history-ui-h0-baseline',
])
requireFragments('docs/product/current-schedule.md', [
  'Current window: P8B — public browser defect audit',
  'Current branch: work-public-browser-audit',
  'Exact next branch after completion: work-history-ui-h0-baseline',
])
requireFragments('docs/product/post-watchlist-program-plan.md', [
  'Current window: P8B',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
])
requireFragments('docs/product/history-ui-repair-plan.md', [
  'Current window: Phase 8 P8B',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
])
requireFragments('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Current window: P8B — public browser defect audit',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
])
requireFragments('docs/README.md', [
  'P8B      work-public-browser-audit                         active',
  'P9H0     work-history-ui-h0-baseline                       exact next after P8B',
  'audits/P8B_SCOPE.md',
])

if (failures.length) {
  console.error('ViewLoom P8B repository verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom P8B repository verification passed.')
console.log('- P8A inventory remains the static route and ownership baseline')
console.log('- P8B work-public-browser-audit is the active audit branch')
console.log('- 21 owned routes, four required viewports, missing surfaces, and History states are governed')
console.log('- provider separation and no-repair boundary remain locked')
console.log('- work-history-ui-h0-baseline is next unless a P0 interrupts')
