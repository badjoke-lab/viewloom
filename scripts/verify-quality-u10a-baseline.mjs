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

for (const path of [
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'apps/web/scripts/quality-u10a-baseline-browser.mjs',
  'scripts/verify-quality-u10a-baseline.mjs',
  '.github/workflows/quality-u10a-baseline.yml',
  'apps/web/twitch/day-flow/index.html',
  'apps/web/kick/day-flow/index.html',
  'apps/web/scripts/public-readiness-audit.mjs',
  '.github/workflows/production-smoke.yml',
  'apps/web/src/live/channel-profile.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
]) requireFile(path)

if (existsSync(join(root, 'docs/work-in-progress/u10a-quality-baseline.md'))) {
  issues.push('completed U10A working note still exists')
}

if (issues.length === 0) {
  const baseline = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
  assert.equal(baseline.schema, 'viewloom-cross-site-quality-u10a-baseline-v1')
  assert.equal(baseline.phase, 'U10A')
  assert.equal(baseline.status, 'complete')
  assert.equal(baseline.branch, 'work-quality-u10a-baseline')
  assert.equal(baseline.implementation_pr, 454)
  assert.equal(baseline.implementation_head, '51c8883ebdc31334828cc345f6a938f17c20a29b')
  assert.equal(baseline.merge_commit, '7665c5244d2fa71539ce9d69b3f5b55c47463075')
  assert.equal(baseline.boundary.product_repair_authorized, false)
  assert.equal(baseline.boundary.provider_separation_required, true)
  assert.deepEqual(baseline.counts, {
    reproduced: 6,
    resolved_before_u10a: 1,
    protected_by_existing_logic: 1,
    browser_measurement_required: 0,
    total: 8,
  })
  assert.equal(baseline.findings.length, 8)
  assert.equal(baseline.browser_evidence.run_id, 28356915812)
  assert.equal(baseline.browser_evidence.artifact_id, 7945707844)
  assert.equal(baseline.browser_evidence.result, 'pass')
  assert.equal(baseline.browser_evidence.mobile_target_scenarios, 18)
  assert.equal(baseline.browser_evidence.minimum_height_px, 34)
  assert.equal(baseline.browser_evidence.horizontal_overflow_scenarios, 0)
  assert.equal(baseline.companion_public_browser_audit.run_id, 28356915810)
  assert.equal(baseline.companion_public_browser_audit.artifact_id, 7945757041)
  assert.equal(baseline.companion_public_browser_audit.production_scenarios, 84)
  assert.equal(baseline.companion_public_browser_audit.p0, 0)

  const ownerMap = JSON.parse(read('docs/audits/cross-site-quality-u10a-owner-map.json'))
  assert.equal(ownerMap.schema, 'viewloom-cross-site-quality-u10a-owner-map-v1')
  assert.equal(ownerMap.phase, 'U10A')
  assert.equal(ownerMap.status, 'complete')
  assert.equal(ownerMap.implementation_pr, 454)
  assert.equal(ownerMap.exact_next_branch, 'work-quality-u10b-shell')
  assert.equal(ownerMap.next_branch_created, false)
  assert.ok(ownerMap.owners.length >= 8)
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
if (readiness.includes('watchlist')) issues.push('Public Readiness baseline changed before U10F')

const smoke = existsSync(join(root, '.github/workflows/production-smoke.yml')) ? read('.github/workflows/production-smoke.yml') : ''
for (const route of ['/about/', '/support/', '/changelog/', '/twitch/channel/', '/kick/channel/', '/twitch/watchlist/', '/kick/watchlist/']) {
  if (smoke.includes(`'${route}'`)) issues.push(`Production Smoke baseline changed before U10F: ${route}`)
}

if (existsSync(join(root, 'apps/web/src/live/channel-profile.ts'))) {
  const channel = read('apps/web/src/live/channel-profile.ts')
  const start = channel.indexOf('function renderMissingId(): void')
  const end = channel.indexOf('function renderError', start)
  const missingId = start >= 0 && end > start ? channel.slice(start, end) : ''
  if (!missingId.includes('Open this page from a History streamer ranking or provide an id query parameter.')) issues.push('Channel no-id baseline message changed')
  if (missingId.includes('<a ')) issues.push('Channel no-id baseline changed before U10F')
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

console.log('ViewLoom completed U10A baseline verification passed.')
console.log('- eight findings and permanent evidence are exact')
console.log('- later roadmap handoffs do not rewrite U10A evidence')
