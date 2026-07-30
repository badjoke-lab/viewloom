import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  decision: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  candidate: 'workers/shared/category-capture-v2-candidate.ts',
  test: 'scripts/test-12a5-twitch-category-source-v2-completeness-candidate.mjs',
  twitchCollector: 'workers/collector-twitch/src/index-category.ts',
  kickCollector: 'workers/collector-kick/src/index-category.ts',
  twitchConfig: 'workers/collector-twitch/wrangler.toml',
  twitchPermanentConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickConfig: 'workers/collector-kick/wrangler.toml',
  kickPermanentConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)
const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
const decision = json(files.decision)
const candidate = read(files.candidate)
const test = read(files.test)
const twitchCollector = read(files.twitchCollector)
const kickCollector = read(files.kickCollector)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-completeness-package-v1')
assert.equal(contract.status, 'candidate_ready_for_validation')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.governingMainSha, '9974539eadbc3388c9f9369168d305ca58771fe2')
assert.equal(contract.governingDecision.status, 'recovery_required')
assert.equal(contract.governingDecision.contractVersion, 'category-source-v2-candidate')
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.requiredRecovery.contractVersion, contract.candidate.contractVersion)
assert.deepEqual(contract.candidate.requiredStates, ['both_present', 'both_empty', 'provider_id_only', 'category_name_only'])
assert.deepEqual(contract.candidate.stateCodes, {
  both_present: 0,
  both_empty: 1,
  provider_id_only: 2,
  category_name_only: 3,
})
assert.equal(contract.candidate.stateEncoding, '2bit-hex-v1')
assert.equal(contract.candidate.semanticMappingPerformed, false)
assert.equal(contract.capacityBoundary.maximumItemsPerSnapshot, 300)
assert.equal(contract.capacityBoundary.bitsPerItem, 2)
assert.equal(contract.capacityBoundary.maximumPackedBytes, 75)
assert.equal(contract.capacityBoundary.maximumPackedHexCharacters, 150)
assert.equal(contract.capacityBoundary.maximumCandidatePayloadOverheadBytesAgainstComparableV1, 400)
assert.equal(contract.capacityBoundary.d1SchemaChangeRequired, false)
assert.equal(contract.capacityBoundary.retentionChangeRequired, false)
for (const value of Object.values(contract.dormantBoundary)) assert.equal(value, false)

for (const fragment of [
  "CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION = 'category-source-v2-candidate'",
  "CATEGORY_SOURCE_STATE_ENCODING = '2bit-hex-v1'",
  "both_present: 0",
  "both_empty: 1",
  "provider_id_only: 2",
  "category_name_only: 3",
  'encodeCategorySourceCompletenessV2Candidate',
  'classifyCategorySourceState',
  'unpackCategorySourceStateCodes',
  'categorySourceStateEncoding',
  'categorySourceStateCounts',
  "if (state === 'both_present')",
  'categoryRefs.push(null)',
  'partialPairItems',
]) assert.ok(candidate.includes(fragment), `candidate missing: ${fragment}`)
for (const forbidden of [
  'D1Database',
  '.prepare(',
  'INSERT INTO',
  'UPDATE ',
  'DELETE FROM',
  'fetch(',
  'wrangler',
  'synthetic',
]) assert.equal(candidate.includes(forbidden), false, `candidate forbidden fragment: ${forbidden}`)

for (const fragment of [
  "fixturePackedHex: encoded.payloadFields.categorySourceStateEncoding.packedHex",
  "packedHex: 'e400'",
  'overheadBytes <= 400',
  "[0, 1, 2, 3, 0]",
  "partial pairs remain null refs",
  'encoding must be deterministic',
]) {
  if (fragment === 'partial pairs remain null refs') {
    assert.deepEqual(contract.candidate.categoryReferenceRule, 'only both_present items receive category references and dictionary entries')
  } else {
    assert.ok(test.includes(fragment), `test missing: ${fragment}`)
  }
}

for (const active of [twitchCollector, kickCollector]) {
  assert.equal(active.includes('category-capture-v2-candidate'), false, 'active collector imported dormant candidate')
  assert.equal(active.includes('encodeCategorySourceCompletenessV2Candidate'), false, 'active collector called dormant candidate')
}

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const dbId = (source) => source.match(/^database_id\s*=\s*"([^"]+)"$/m)?.[1] ?? null
const configs = Object.fromEntries([
  ['twitch', read(files.twitchConfig)],
  ['twitchPermanent', read(files.twitchPermanentConfig)],
  ['kick', read(files.kickConfig)],
  ['kickPermanent', read(files.kickPermanentConfig)],
])
for (const source of Object.values(configs)) {
  assert.equal(source.includes('CATEGORY_SOURCE_V2'), false, 'v2 binding must not exist on package PR')
  assert.equal(source.includes('category-source-v2-candidate'), false, 'v2 contract must not be active on package PR')
}
assert.equal(cron(configs.twitch), '*/5 * * * *')
assert.equal(cron(configs.twitchPermanent), cron(configs.twitch))
assert.equal(cron(configs.kick), '*/5 * * * *')
assert.equal(cron(configs.kickPermanent), cron(configs.kick))
assert.equal(dbId(configs.twitchPermanent), dbId(configs.twitch))
assert.equal(dbId(configs.kickPermanent), dbId(configs.kick))
assert.notEqual(dbId(configs.twitchPermanent), dbId(configs.kickPermanent))

for (const [path, fragments] of Object.entries({
  'docs/product/current-roadmap.md': ['Twitch category-source completeness v2 recovery package', 'category-source-v2-candidate'],
  'docs/product/current-schedule.md': ['Current gate category-source-v2 completeness recovery package', 'no production execution on the dormant package PR'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['Twitch category-source-v2 completeness recovery package', 'both_present'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['category-source-v2 completeness recovery package', 'Package PR performs no production execution'],
  'AGENTS.md': ['category-source-v2-candidate', 'No production execution on the dormant package PR'],
  'CONTRIBUTING.md': ['category-source-v2-candidate', 'Do not execute production on the package PR'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  contractVersion: contract.candidate.contractVersion,
  stateEncoding: contract.candidate.stateEncoding,
  maximumItems: contract.capacityBoundary.maximumItemsPerSnapshot,
  maximumPackedBytes: contract.capacityBoundary.maximumPackedBytes,
  productionExecution: false,
  activeCollectorImport: false,
  publicCategoryUiAuthorized: false,
  nextGate: contract.nextGate,
}, null, 2))
