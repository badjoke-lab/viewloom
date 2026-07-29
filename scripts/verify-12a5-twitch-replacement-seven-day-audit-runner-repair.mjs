import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  repair: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  repairAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  package: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  packageAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  runner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  test: 'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs',
  schedule: 'docs/product/current-schedule.md',
  roadmap: 'docs/product/current-roadmap.md',
  wip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)
const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const repair = json(files.repair)
const repairAcceptance = json(files.repairAcceptance)
const pkg = json(files.package)
const packageAcceptance = json(files.packageAcceptance)
const runner = read(files.runner)
const test = read(files.test)

assert.equal(repair.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-v1')
assert.equal(repair.status, 'accepted')
assert.equal(repair.phase, '12A-5B-R2')
assert.equal(repair.trackingIssue, 659)
assert.equal(repair.governingMainSha, '3f15d18ee3f7b31a71b10ff6f192eead404da92b')
assert.equal(repair.acceptedPackagePr, 661)
assert.equal(repair.acceptedPackageAcceptancePr, 662)
assert.equal(repair.defect.code, 'sqlite_cte_scope_cross_statement')
assert.equal(repair.defect.productionExecutionOccurred, false)
assert.equal(repair.repair.exportSqlBuilder, true)
assert.equal(repair.repair.slotEnumerationReadsMinuteSnapshotsDirectly, true)
assert.equal(repair.repair.allStatementsRemainSelectOrWith, true)
assert.equal(repair.repair.expectedFinalSlotsPreserved, 2016)
assert.equal(repair.acceptance.acceptancePr, 664)
assert.equal(repair.acceptance.repairPr, 663)
assert.equal(repair.acceptance.repairCandidateHeadSha, 'd171a74e4e6f1e8e9af60324088744d4ce50ee9e')
assert.equal(repair.acceptance.repairMergeSha, 'ab33afa4d6195532652791be2380a1fa9a278491')
assert.equal(repair.acceptance.workflowRunId, 30475011149)
assert.equal(repair.acceptance.workflowJobId, 90654426211)
assert.equal(repair.acceptance.conclusion, 'success')
assert.equal(Object.values(repair.boundaries).every((value) => value === false), true)

assert.equal(repairAcceptance.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance-v1')
assert.equal(repairAcceptance.status, 'accepted')
assert.equal(repairAcceptance.acceptancePr, 664)
assert.equal(repairAcceptance.repairPr, 663)
assert.equal(repairAcceptance.repairCandidateHeadSha, repair.acceptance.repairCandidateHeadSha)
assert.equal(repairAcceptance.repairMergeSha, repair.acceptance.repairMergeSha)
assert.equal(repairAcceptance.validation.workflowRunId, repair.acceptance.workflowRunId)
assert.equal(repairAcceptance.validation.workflowJobId, repair.acceptance.workflowJobId)
assert.equal(repairAcceptance.validation.conclusion, 'success')
assert.equal(Object.values(repairAcceptance.validation).every((value) => value === true || value === 'success' || Number.isInteger(value)), true)
assert.equal(repairAcceptance.defect.code, repair.defect.code)
assert.equal(repairAcceptance.acceptedRepair.slotEnumerationReadsMinuteSnapshotsDirectly, true)
assert.equal(repairAcceptance.acceptedRepair.laterStatementsReferenceScopedCte, false)
assert.equal(repairAcceptance.acceptedRepair.expectedFinalSlotsPreserved, 2016)
assert.equal(Object.values(repairAcceptance.boundaries).every((value) => value === false), true)

assert.equal(pkg.status, 'accepted_dormant')
assert.equal(pkg.acceptance.acceptancePr, 662)
assert.equal(pkg.window.expectedFinalSlots, 2016)
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.acceptancePr, 662)
assert.equal(packageAcceptance.boundaries.productionExecutionIncluded, false)

assert.ok(runner.includes('export function buildTwitchWindowSql'))
assert.ok(runner.includes("SELECT bucket_minute AS observed_bucket_minute\nFROM minute_snapshots"))
assert.ok(runner.includes("AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'"))
const slotQuery = runner.match(/SELECT bucket_minute AS observed_bucket_minute[\s\S]*?ORDER BY bucket_minute;/)?.[0]
assert.ok(slotQuery)
assert.equal(slotQuery.includes('FROM scoped'), false)
assert.equal(slotQuery.includes("provider = 'twitch'"), true)
assert.equal(slotQuery.includes("bucket_minute >= '${start}'"), true)
assert.equal(slotQuery.includes("bucket_minute < '${end}'"), true)
for (const forbidden of ['wrangler@4 deploy', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE']) {
  assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
}

for (const fragment of [
  'buildTwitchWindowSql',
  "assert.ok(slotStatement.includes('FROM minute_snapshots'))",
  "assert.equal(slotStatement.includes('FROM scoped'), false)",
  "assert.equal(statements.slice(1).some((statement) => statement.includes('FROM scoped')), false)",
  'sqlStatementScopeSafe: true',
]) assert.ok(test.includes(fragment), `test missing: ${fragment}`)

for (const path of [files.schedule, files.roadmap, files.wip]) {
  const source = read(path)
  assert.ok(source.includes('PR #663'), `${path}: repair PR missing`)
  assert.ok(source.includes('PR #664'), `${path}: repair acceptance PR missing`)
  assert.ok(source.includes('work-659-twitch-replacement-audit-checkpoint-package'), `${path}: checkpoint branch missing`)
}

console.log(JSON.stringify({
  ok: true,
  defect: repair.defect.code,
  runnerScopeSafe: true,
  runnerRepairAccepted: true,
  repairPr: repair.acceptance.repairPr,
  repairAcceptancePr: repair.acceptance.acceptancePr,
  productionExecutionOccurred: false,
  nextGate: repair.nextGate,
}, null, 2))
