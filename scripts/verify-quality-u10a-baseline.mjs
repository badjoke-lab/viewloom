import assert from 'node:assert/strict'
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

const required = [
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/work-in-progress/u10a-quality-baseline.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'apps/web/scripts/quality-u10a-baseline-browser.mjs',
  'scripts/verify-quality-u10a-baseline.mjs',
  '.github/workflows/quality-u10a-baseline.yml',
  'apps/web/twitch/day-flow/index.html',
  'apps/web/kick/day-flow/index.html',
  'apps/web/scripts/public-readiness-audit.mjs',
  '.github/workflows/production-smoke.yml',
  'apps/web/src/live/channel-profile.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
]
for (const path of required) requireFile(path)

if (issues.length === 0) {
  const baseline = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
  assert.equal(baseline.schema, 'viewloom-cross-site-quality-u10a-baseline-v1')
  assert.equal(baseline.phase, 'U10A')
  assert.equal(baseline.status, 'active')
  assert.equal(baseline.branch, 'work-quality-u10a-baseline')
  assert.equal(baseline.entry_main_commit, '3ad171002ca908f8cf05e458c40009f88fdc6df4')
  assert.equal(baseline.boundary.product_repair_authorized, false)
  assert.equal(baseline.boundary.p0_isolation_only, true)
  assert.equal(baseline.boundary.provider_separation_required, true)
  assert.equal(baseline.counts.total, 8)
  assert.equal(baseline.findings.length, 8)
  for (const id of [
    'U10A-DF-DATE-ACCESSIBLE-NAME',
    'U10A-DF-FIRST-RENDER-LAYOUT',
    'U10A-WATCHLIST-PUBLIC-READINESS',
    'U10A-PRODUCTION-SMOKE-ROUTE-OWNERSHIP',
    'U10A-CHANNEL-NO-ID-ENTRY',
    'U10A-BATTLE-RECOMMENDED-OWNER',
    'U10A-BATTLE-SELECTED-TIME-COHERENCE',
    'U10A-MOBILE-TARGET-SIZES',
  ]) assert.ok(baseline.findings.some((item) => item.id === id), `missing U10A finding ${id}`)

  const ownerMap = JSON.parse(read('docs/audits/cross-site-quality-u10a-owner-map.json'))
  assert.equal(ownerMap.schema, 'viewloom-cross-site-quality-u10a-owner-map-v1')
  assert.equal(ownerMap.phase, 'U10A')
  assert.equal(ownerMap.status, 'active')
  assert.ok(ownerMap.owners.length >= 8)
  for (const surface of [
    'Day Flow route shell',
    'Battle Lines state and rendering',
    'Channel profile no-id entry',
    'Public Readiness route ownership',
    'Production Smoke route ownership',
    'mobile target-size rules',
  ]) assert.ok(ownerMap.owners.some((item) => item.surface === surface), `missing owner surface ${surface}`)
}

for (const path of ['apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html']) {
  requireText(path, [
    '<label class="toolbar-label" for="dayflow-date-',
    'data-dayflow-date type="date"',
    'class="dayflow-layout-shell is-split"',
    "window.localStorage.setItem(key, 'wide')",
    "shell?.classList.add('is-wide')",
  ])
}

const readiness = existsSync(join(root, 'apps/web/scripts/public-readiness-audit.mjs')) ? read('apps/web/scripts/public-readiness-audit.mjs') : ''
if (readiness.includes('watchlist')) issues.push('Public Readiness baseline changed: Watchlist is now present; update U10A classification before repair proceeds')

const smoke = existsSync(join(root, '.github/workflows/production-smoke.yml')) ? read('.github/workflows/production-smoke.yml') : ''
for (const route of ['/about/', '/support/', '/changelog/', '/twitch/channel/', '/kick/channel/', '/twitch/watchlist/', '/kick/watchlist/']) {
  if (smoke.includes(`'${route}'`)) issues.push(`Production Smoke baseline changed: ${route} is now included`)
}

if (existsSync(join(root, 'apps/web/src/live/channel-profile.ts'))) {
  const channel = read('apps/web/src/live/channel-profile.ts')
  const start = channel.indexOf('function renderMissingId(): void')
  const end = channel.indexOf('function renderError', start)
  const missingId = start >= 0 && end > start ? channel.slice(start, end) : ''
  if (!missingId.includes('Open this page from a History streamer ranking or provide an id query parameter.')) issues.push('Channel no-id baseline message changed')
  if (missingId.includes('<a ')) issues.push('Channel no-id baseline changed: inline action now exists')
  if (!missingId.includes("setHtml('[data-channel-summary]'")) issues.push('Channel no-id summary baseline changed')
}

requireText('apps/web/src/live/battle-lines-current-shell-entry.ts', [
  'recommendedBattle: Battle | null',
  'state.selectedBattleId = next.primaryBattle?.id ?? null',
  'state.selectedBattleId = payload.primaryBattle.id',
  'battle.id === data.primaryBattle?.id && !state.manualBattle',
  'state.selectedIndex = latestUsefulIndex(next)',
  'renderPrimary(data)',
  'renderInspector(data)',
  "next.set('point', String(state.selectedIndex))",
])

requireText('apps/web/scripts/quality-u10a-baseline-browser.mjs', [
  "schema: 'viewloom-quality-u10a-browser-v1'",
  'auditDayFlowAccessibleName',
  'auditChannelNoId',
  'auditBattleCoherence',
  'auditMobileTargets',
  "assert.equal(initial.primaryPair, 'Alpha vs Beta'",
  "assert.notEqual(initial.primaryPair, 'Alpha vs Gamma'",
  "new URL(location.href).searchParams.get('point') === '1'",
])

requireText('docs/work-in-progress/u10a-quality-baseline.md', [
  'Status: active',
  'Branch: `work-quality-u10a-baseline`',
  'No product repair in this branch except proven P0 isolation.',
  'work-quality-u10b-shell',
])
requireText('docs/product/current-roadmap.md', [
  'Phase 10 U10A active',
  'Active implementation branch: work-quality-u10a-baseline',
  'Exact next implementation branch after U10A: work-quality-u10b-shell',
])
requireText('docs/product/current-schedule.md', [
  'U10A defect and ownership baseline       active',
  'Active implementation branch             work-quality-u10a-baseline',
  'Exact next branch after U10A              work-quality-u10b-shell',
])
requireText('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 10 — U10A defect and ownership baseline active',
  'Current implementation branch: `work-quality-u10a-baseline`',
  'Exact next implementation branch after U10A: `work-quality-u10b-shell`',
])
requireText('docs/product/cross-site-quality-remediation-plan.md', [
  'Status: active implementation plan',
  'Current branch: `work-quality-u10a-baseline`',
  'Exact next branch after U10A: `work-quality-u10b-shell`',
])
requireText('.github/workflows/quality-u10a-baseline.yml', [
  'name: Quality U10A Baseline',
  'Verify U10A repository baseline',
  'Run U10A deterministic browser baseline',
  'quality-u10a-baseline',
  'cancel-in-progress: true',
])

if (issues.length) {
  console.error('ViewLoom U10A baseline verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom U10A baseline verification passed.')
console.log('- eight findings are classified without product repair')
console.log('- authoritative and compatibility owners are recorded')
console.log('- current omissions and resolved-before-U10A state are locked')
console.log('- deterministic browser evidence is required')
console.log('- U10B is exact next after U10A')
