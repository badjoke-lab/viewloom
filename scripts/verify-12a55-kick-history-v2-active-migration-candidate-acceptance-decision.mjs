import fs from 'node:fs'

const d = JSON.parse(fs.readFileSync('docs/audits/12a55-kick-history-v2-active-migration-candidate-acceptance-decision.json', 'utf8'))
const d53 = JSON.parse(fs.readFileSync('docs/audits/12a53-kick-history-v2-active-migration-candidate-decision.json', 'utf8'))
const wrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')
const retired12a30 = fs.readFileSync('.github/workflows/analytics-12a30-kick-history-category-runtime-wiring-candidate.yml', 'utf8')

function assert(value, message) {
  if (!value) throw new Error(message)
}

assert(d.schemaVersion === 'viewloom-12a55-kick-history-v2-active-migration-candidate-acceptance-decision-v1', 'schema')
assert(d.phase === '12A-55' && d.issue === 1024 && d.provider === 'kick', 'identity')
assert(d.status === 'go_to_separate_production_coupled_gate_merge_still_forbidden', 'status')
assert(d.decision === 'GO', 'decision')
assert(d.sourceMainSha === '1291c96c951600af8e73adada28f1e349f479a05', 'source main')

const c = d.frozenCandidate
assert(c.pr === 1021, 'candidate PR')
assert(c.branch === 'candidate/1020-kick-history-v2-active-migration', 'candidate branch')
assert(c.headSha === '184bd489c544af8368a654eec1e09dc7708fb740', 'candidate head')
assert(c.draft === true && c.open === true && c.merged === false, 'candidate state')
assert(c.changedFiles === 5 && c.exactFiles.length === 5, 'candidate file count')
for (const path of [
  '.github/workflows/analytics-12a54-kick-history-v2-active-migration-candidate.yml',
  'docs/audits/12a54-kick-history-v2-active-migration-candidate.json',
  'scripts/verify-12a54-kick-history-v2-active-migration-candidate.mjs',
  'workers/collector-kick/src/entry.ts',
  'workers/collector-kick/src/history-category-generation-engine.ts',
]) assert(c.exactFiles.includes(path), `candidate file missing: ${path}`)

const v = d.acceptedVerification
assert(v.candidateWorkflowRun === 32654426394 && v.candidateWorkflowConclusion === 'success', 'candidate CI')
assert(v.collectorChecksRun === 32654426385 && v.collectorChecksConclusion === 'success', 'collector checks')
assert(v.deployPlannerRun === 32654426361, 'deploy planner run')
assert(v.deployPlannerVerifyConclusion === 'success' && v.deployPlannerPlanConclusion === 'success', 'deploy planner checks')
assert(v.twitchDeployConclusion === 'skipped' && v.kickDeployConclusion === 'skipped', 'provider deploy no-op')
assert(v.remoteSchemaConclusion === 'skipped' && v.productionDeploymentDuringCandidateReview === false, 'production no-op')

assert(d53.decision === 'GO' && d53.authorization.openSeparateDraftCandidateGate === true, '12A-53 predecessor')
assert(wrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'production master enable drift')
assert(wrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'production startDay drift')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'production cron drift')
assert(!wrangler.includes('HISTORY_CATEGORY_GENERATION_ENGINE'), 'production selector must remain absent')

assert(retired12a30.includes('Analytics 12A30 Kick History Runtime Wiring Historical Guard'), '12A-30 cleanup not present')
assert(!retired12a30.split(/\r?\n/).some((line) => line.trim() === "- 'workers/collector-kick/src/entry.ts'"), 'stale 12A-30 entry trigger remains')

const rationale = d.acceptanceRationale
for (const key of [
  'selectorMatrixVerified',
  'mutualExclusionVerified',
  'invalidSelectorFailsClosed',
  'masterEnableNotExactTrueFailsClosed',
  'sharedStartDayVerified',
  'deterministicV2WriterFixtureVerified',
  'collectorTypecheckVerified',
  'candidatePrDeployPlannerNoOpVerified',
  'productionWranglerUnchanged',
  'staleHistoricalCiFalseFailureRemediated',
  'candidateScopeStillFiveFilesAgainstCurrentMain',
  'candidateRequiresCurrentMainRefreshBeforeAnyMerge',
]) assert(rationale[key] === true, `acceptance rationale missing: ${key}`)

const required = new Set(d.nextGateRequirements)
for (const item of [
  'refresh or reproduce the five-file candidate against the then-current main before merge',
  'pin the exact refreshed candidate head before any Ready or merge transition',
  'treat the eventual candidate merge as a production collector deployment because workers/collector-kick paths trigger main-push deployment',
  'do not configure selector v2 or disable v1 from the candidate-merge gate',
]) assert(required.has(item), `next gate requirement missing: ${item}`)

const auth = d.authorization
for (const key of ['repositoryDecisionArtifact', 'decisionVerifierAndPrOnlyCi', 'openSeparateProductionCoupledGate']) {
  assert(auth[key] === true, `authorized Decision action missing: ${key}`)
}
for (const [key, value] of Object.entries(auth)) {
  if (['repositoryDecisionArtifact', 'decisionVerifierAndPrOnlyCi', 'openSeparateProductionCoupledGate'].includes(key)) continue
  assert(value === false, `authority must remain false: ${key}`)
}
assert(d.nextGate.startsWith('Open one separately scoped production-coupled'), 'next gate')

console.log('12A-55 Decision verified: frozen Draft candidate may advance only to a separate production-coupled refresh/merge gate; merge, deploy, and v2 enablement remain forbidden')
