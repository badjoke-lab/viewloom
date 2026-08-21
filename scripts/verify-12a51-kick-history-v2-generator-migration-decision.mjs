import fs from 'node:fs'

const path = 'docs/audits/12a51-kick-history-v2-generator-migration-decision.json'
const decision = JSON.parse(fs.readFileSync(path, 'utf8'))
const schemaAcceptance = JSON.parse(fs.readFileSync('docs/audits/12a50-kick-history-v2-schema-retry-acceptance-evidence.json', 'utf8'))
const v2Candidate = fs.readFileSync('workers/dormant/history-category-chunked-v2-candidate.ts', 'utf8')
const activeEntry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const activeWrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(decision.schemaVersion === 'viewloom-12a51-kick-history-v2-generator-migration-decision-v1', 'schema')
assert(decision.phase === '12A-51', 'phase')
assert(decision.issue === 958, 'issue')
assert(decision.provider === 'kick', 'provider')
assert(decision.status === 'dormant_v2_generator_package_go_production_forbidden', 'status')
assert(decision.decision === 'GO', 'decision')
assert(decision.sourceMainSha === 'acd1a51c7fffedffbff8bdfb88a8d0f06801ff0b', 'source main')

assert(schemaAcceptance.phase === '12A-50' && schemaAcceptance.status === 'PASS', '12A50 schema acceptance')
assert(schemaAcceptance.productionRunId === 32395881830, 'production schema run')
assert(schemaAcceptance.firstApplyStatementCount === 5, 'first schema apply count')
assert(schemaAcceptance.secondApplyStatementCount === 0, 'second schema apply count')
assert(schemaAcceptance.v1SchemaCompleteAfter === true, 'v1 schema complete')
assert(schemaAcceptance.v2SchemaCompleteAfter === true, 'v2 schema complete')
assert(schemaAcceptance.v2AggregateRowsAfter === 0, 'v2 rows must remain empty')
assert(schemaAcceptance.providerLeakageRowsAfter === 0, 'provider leakage')

const prereq = decision.acceptedPrerequisites
assert(prereq.v2CandidatePr === 927, 'v2 candidate PR')
assert(prereq.v2CandidateContractVersion === 'category-source-v2-chunked', 'contract version')
assert(prereq.chunkSize === 128, 'chunk size')
assert(prereq.categoryRowCapPerDay === 300, 'category cap')
assert(prereq.physicalChunkRowBudgetPerDay === 1000, 'chunk budget')
assert(prereq.encodedContributorBytesCapPerDay === 47196, 'encoded-byte cap')
assert(prereq.retentionDays === 180, 'retention')

for (const text of [
  "KICK_HISTORY_CATEGORY_V2_CONTRACT_VERSION = 'category-source-v2-chunked'",
  'KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE = 128',
  'KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP = 300',
  'KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET = 1000',
  'KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP = 47_196',
  "'unavailable_encoded_bytes_overflow'",
  'productionWiringIncluded: false',
]) assert(v2Candidate.includes(text), `v2 candidate drift: ${text}`)

assert(activeEntry.includes('maybeRunKickHistoryCategoryPermanentIntegration'), 'active v1 integration missing')
assert(!activeEntry.includes('history-category-chunked-v2-candidate'), 'v2 must not already be wired')
assert(activeWrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'active v1 enable state changed')
assert(activeWrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'active v1 startDay changed')
assert(activeWrangler.includes('crons = ["*/5 * * * *"]'), 'cron changed')

assert(decision.selectedNextStage.name === 'repository_only_dormant_v2_generator_package', 'next stage')
assert(decision.selectedNextStage.requiredLocation === 'outside_active_collector_deployment_paths', 'package location')
assert(decision.migrationSafety.simultaneousAuthoritativeV1AndV2ProductionGenerationAllowed === false, 'dual authority')
assert(decision.migrationSafety.v1ProductionDisablementAllowedInNextStage === false, 'v1 disablement')
assert(decision.migrationSafety.v2ProductionEnablementAllowedInNextStage === false, 'v2 enablement')
assert(decision.migrationSafety.activeCollectorWiringAllowedInNextStage === false, 'collector wiring')
assert(decision.migrationSafety.collectorDeploymentAllowedInNextStage === false, 'collector deployment')

const auth = decision.authorization
assert(auth.repositoryDormantV2GeneratorPackage === true, 'dormant package authority')
assert(auth.localDeterministicTests === true, 'local tests authority')
for (const [key, value] of Object.entries(auth)) {
  if (['repositoryDormantV2GeneratorPackage', 'localDeterministicTests'].includes(key)) continue
  assert(value === false, `authorization must remain false: ${key}`)
}

assert(decision.nextGate.includes('repository-only dormant Kick History Category v2 generator package'), 'next gate')
console.log('12A-51 Kick History v2 generator migration Decision verified; dormant package only, production forbidden')
