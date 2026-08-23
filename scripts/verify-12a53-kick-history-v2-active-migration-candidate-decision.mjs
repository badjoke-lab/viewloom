import fs from 'node:fs'

const d = JSON.parse(fs.readFileSync('docs/audits/12a53-kick-history-v2-active-migration-candidate-decision.json', 'utf8'))
const p52 = JSON.parse(fs.readFileSync('docs/audits/12a52-kick-history-v2-dormant-generator-package.json', 'utf8'))
const p50 = JSON.parse(fs.readFileSync('docs/audits/12a50-kick-history-v2-schema-retry-acceptance-evidence.json', 'utf8'))
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const wrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')
const deploy = fs.readFileSync('.github/workflows/deploy-collector-workers.yml', 'utf8')

function assert(value, message) {
  if (!value) throw new Error(message)
}

assert(d.schemaVersion === 'viewloom-12a53-kick-history-v2-active-migration-candidate-decision-v1', 'schema')
assert(d.phase === '12A-53' && d.issue === 962 && d.provider === 'kick', 'identity')
assert(d.status === 'separate_draft_candidate_gate_go_active_change_still_forbidden', 'status')
assert(d.decision === 'GO', 'decision')
assert(d.sourceMainSha === '3e818f8ee40a7173016693687f45c97f6b20e716', 'source main')

assert(p50.phase === '12A-50' && p50.status === 'PASS', '12A50 schema acceptance')
assert(p50.v2SchemaCompleteAfter === true && p50.v2AggregateRowsAfter === 0, 'v2 production schema baseline')
assert(p52.phase === '12A-52' && p52.status === 'dormant_repository_package', '12A52 dormant package')
assert(p52.authorization.productionV2GeneratorWiring === false, '12A52 wiring boundary')
assert(p52.authorization.productionV1GeneratorDisablement === false, '12A52 v1 boundary')
assert(p52.implementation.activeCollectorEdited === false, '12A52 active collector boundary')

assert(entry.includes('maybeRunKickHistoryCategoryPermanentIntegration'), 'current v1 wiring missing')
assert(!entry.includes('history-category-v2-generator'), 'v2 already wired')
assert(!entry.includes('HISTORY_CATEGORY_GENERATION_ENGINE'), 'active selector already present')
assert(wrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'v1 enable drift')
assert(wrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'v1 startDay drift')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'cron drift')
assert(!wrangler.includes('HISTORY_CATEGORY_GENERATION_ENGINE'), 'engine selector already configured')

assert(deploy.includes("'workers/collector-kick/**'"), 'collector deploy coupling missing')
assert(deploy.includes('push:'), 'main push deployment missing')
assert(d.deploymentCoupling.candidateMergeWouldBeProductionDeployment === true, 'deployment coupling decision')
assert(d.deploymentCoupling.candidatePreparationMustRemainDraftAndUnmerged === true, 'draft/unmerged boundary')

const c = d.selectedCandidateContract
assert(c.candidateState === 'Draft' && c.candidateMustRemainUnmerged === true, 'candidate state')
assert(c.engineSelector === 'HISTORY_CATEGORY_GENERATION_ENGINE', 'selector')
assert(c.masterEnable === 'HISTORY_CATEGORY_GENERATION_ENABLED', 'master enable')
assert(c.sharedStartDay === 'HISTORY_CATEGORY_START_DAY', 'shared start day')
assert(c.selectorSemantics.absent === 'legacy_v1', 'absent selector')
assert(c.selectorSemantics.v1 === 'v1' && c.selectorSemantics.v2 === 'v2', 'selector engines')
assert(c.selectorSemantics.invalid === 'none_fail_closed', 'invalid selector fail-close')
assert(c.masterEnableSemantics.not_exact_true === 'neither_engine_runs', 'master disable fail-close')
assert(c.mutualExclusionRequired === true && c.simultaneousV1V2ExecutionAllowed === false, 'mutual exclusion')
assert(c.activeWranglerMayChangeInCandidate === false, 'active wrangler boundary')
assert(c.newEngineSelectorMayBeConfiguredInCandidate === false, 'selector config boundary')
assert(c.newIndependentV2EnableFlagAllowed === false, 'independent v2 enable boundary')
assert(c.newIndependentV2StartDayAllowed === false, 'independent v2 start boundary')
assert(c.newCron === false && c.backfill === false, 'cron/backfill boundary')

const tests = new Set(d.requiredCandidateTests)
for (const required of [
  'selector absent plus master enable true routes to v1 only',
  'selector v1 plus master enable true routes to v1 only',
  'selector v2 plus master enable true routes to v2 only',
  'master enable false routes to neither engine for every selector',
  'invalid selector routes to neither engine and does not silently default to v2',
  'v1 and v2 adapters cannot both be invoked from one scheduled event',
  'active Wrangler remains unchanged and contains no HISTORY_CATEGORY_GENERATION_ENGINE setting',
  'candidate exact file set is pinned and candidate remains Draft',
]) assert(tests.has(required), `missing required candidate test: ${required}`)

const auth = d.authorization
for (const key of ['repositoryDecisionArtifact', 'decisionVerifierAndPrOnlyCi', 'openSeparateDraftCandidateGate']) {
  assert(auth[key] === true, `missing Decision authority: ${key}`)
}
for (const [key, value] of Object.entries(auth)) {
  if (['repositoryDecisionArtifact', 'decisionVerifierAndPrOnlyCi', 'openSeparateDraftCandidateGate'].includes(key)) continue
  assert(value === false, `authorization must remain false: ${key}`)
}
assert(d.productionCostBoundary.canonicalHistoricalV1PassRowsRead === 16117, 'historical v1 cost baseline')
assert(d.productionCostBoundary.hardMaximumRowsRead === 250000, 'cost threshold')
assert(d.productionCostBoundary.v2ProductionRowsReadMeasured === false, 'invented v2 cost')
assert(d.productionCostBoundary.newProductionCostProbeAuthorized === false, 'production cost probe boundary')
assert(d.nextGate.startsWith('Open one separate gate'), 'next gate must be separate')
assert(d.nextGate.includes('Draft Kick History v2 active migration candidate'), 'next gate candidate')

console.log('12A-53 Decision verified: GO only to a separate Draft candidate gate; active collector change, merge, deploy, and production remain forbidden')
