import fs from 'node:fs'

const d = JSON.parse(fs.readFileSync('docs/audits/12a53-kick-history-v2-active-migration-candidate-decision.json', 'utf8'))
const p52 = JSON.parse(fs.readFileSync('docs/audits/12a52-kick-history-v2-dormant-generator-package.json', 'utf8'))
const p50 = JSON.parse(fs.readFileSync('docs/audits/12a50-kick-history-v2-schema-retry-acceptance-evidence.json', 'utf8'))
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const wrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')
const deploy = fs.readFileSync('.github/workflows/deploy-collector-workers.yml', 'utf8')

function assert(v, m) { if (!v) throw new Error(m) }

assert(d.schemaVersion === 'viewloom-12a53-kick-history-v2-active-migration-candidate-decision-v1', 'schema')
assert(d.phase === '12A-53' && d.issue === 962 && d.provider === 'kick', 'identity')
assert(d.status === 'draft_disabled_by_default_candidate_go_merge_and_deploy_forbidden', 'status')
assert(d.decision === 'GO', 'decision')
assert(d.sourceMainSha === 'df99141aced36be5236bf178720521bd81db4e33', 'source main')

assert(p50.phase === '12A-50' && p50.status === 'PASS', '12A50')
assert(p50.v2SchemaCompleteAfter === true && p50.v2AggregateRowsAfter === 0, 'v2 production schema baseline')
assert(p52.phase === '12A-52' && p52.status === 'dormant_repository_package', '12A52')
assert(p52.authorization.productionV2GeneratorWiring === false, '12A52 wiring boundary')
assert(p52.authorization.productionV1GeneratorDisablement === false, '12A52 v1 boundary')

const c = d.selectedCandidateContract
assert(c.candidateState === 'Draft' && c.candidateMustRemainUnmerged === true, 'draft/unmerged')
assert(c.engineSelector === 'HISTORY_CATEGORY_GENERATION_ENGINE', 'selector')
assert(c.masterEnable === 'HISTORY_CATEGORY_GENERATION_ENABLED', 'master enable')
assert(c.sharedStartDay === 'HISTORY_CATEGORY_START_DAY', 'startDay')
assert(c.selectorSemantics.absent === 'legacy_v1', 'absent selector')
assert(c.selectorSemantics.v1 === 'v1' && c.selectorSemantics.v2 === 'v2', 'selector engines')
assert(c.selectorSemantics.invalid === 'none_fail_closed', 'invalid fail close')
assert(c.mutualExclusionRequired === true && c.simultaneousV1V2ExecutionAllowed === false, 'mutual exclusion')
assert(c.activeWranglerMayChangeInCandidate === false, 'wrangler change')
assert(c.newEngineSelectorMayBeConfiguredInCandidate === false, 'selector config')
assert(c.newIndependentV2EnableFlagAllowed === false && c.newIndependentV2StartDayAllowed === false, 'independent v2 vars')

assert(entry.includes('maybeRunKickHistoryCategoryPermanentIntegration'), 'current v1 wiring missing')
assert(!entry.includes('history-category-v2-generator'), 'v2 already wired')
assert(wrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'v1 enable drift')
assert(wrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'v1 startDay drift')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'cron drift')
assert(!wrangler.includes('HISTORY_CATEGORY_GENERATION_ENGINE'), 'engine selector already configured')

assert(deploy.includes("'workers/collector-kick/**'"), 'collector deploy coupling missing')
assert(deploy.includes('push:'), 'main push deployment missing')
assert(d.deploymentCoupling.candidateMergeWouldBeProductionDeployment === true, 'deployment coupling decision')

const auth = d.authorization
for (const k of ['prepareOneDraftActiveMigrationCandidate','candidateLocalTests','candidatePullRequestCI']) assert(auth[k] === true, `missing candidate authority ${k}`)
for (const [k,v] of Object.entries(auth)) {
  if (['prepareOneDraftActiveMigrationCandidate','candidateLocalTests','candidatePullRequestCI'].includes(k)) continue
  assert(v === false, `authorization must remain false: ${k}`)
}
assert(d.productionCostBoundary.canonicalHistoricalV1PassRowsRead === 16117, 'cost pass')
assert(d.productionCostBoundary.hardMaximumRowsRead === 250000, 'cost threshold')
assert(d.productionCostBoundary.v2ProductionRowsReadMeasured === false, 'invented v2 cost')
assert(d.nextGate.includes('Draft Kick History v2 active migration candidate'), 'next gate')

console.log('12A-53 v2 active migration candidate Decision verified; Draft preparation only, merge/deploy forbidden')
