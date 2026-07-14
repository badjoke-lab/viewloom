import fs from 'node:fs'
import path from 'node:path'

const [rawDir, outputFile] = process.argv.slice(2)
if (!rawDir || !outputFile) {
  console.error('usage: node collect-12a4-kick-category-schema-recovery-evidence.mjs <raw-dir> <output-file>')
  process.exit(2)
}

const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-kick-category-schema-recovery-contract.json', 'utf8'))
const acceptedAudit = JSON.parse(fs.readFileSync(contract.acceptedAudit.evidenceFile, 'utf8'))
const parseErrors = []

function readJson(name, fallback = null) {
  const file = path.join(rawDir, name)
  if (!fs.existsSync(file)) return fallback
  const text = fs.readFileSync(file, 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    parseErrors.push({ file: name, error: error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180), preview: text.trim().replace(/\s+/g, ' ').slice(0, 120) })
    return fallback
  }
}

const readText = (name, fallback = '') => {
  const file = path.join(rawDir, name)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : fallback
}
const numeric = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const time = (value) => {
  const parsed = Date.parse(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : null
}
const latency = (snapshot) => {
  const bucket = time(snapshot?.bucket_minute)
  const collected = time(snapshot?.collected_at)
  return bucket !== null && collected !== null ? Math.max(0, collected - bucket) : null
}

const trigger = readJson('trigger.json')
const lifecycle = readJson('lifecycle.json', {})
const pre = readJson('pre.json')
const first = readJson('first-apply.json')
const second = readJson('second-apply.json')
const post = readJson('post.json')
const preState = pre?.state ?? null
const firstPost = first?.post ?? null
const postState = post?.state ?? firstPost ?? null
const latencyBeforeMs = latency(preState?.operational?.latestSnapshot)
const latencyAfterMs = latency(postState?.operational?.latestSnapshot)
const latencyDeltaMs = latencyBeforeMs !== null && latencyAfterMs !== null ? Math.abs(latencyAfterMs - latencyBeforeMs) : null
const sizeBefore = numeric(preState?.databaseSizeBytes)
const sizeAfter = numeric(postState?.databaseSizeBytes ?? firstPost?.databaseSizeBytes)
const sizeIncreaseBytes = sizeBefore !== null && sizeAfter !== null ? Math.max(0, sizeAfter - sizeBefore) : null

const checks = {
  acceptedAuditPass: acceptedAudit?.gate?.recoveryAuditPass === true,
  twitchAlreadyComplete: acceptedAudit?.providers?.twitch?.schemaState === 'complete',
  kickPreviouslyAbsent: acceptedAudit?.providers?.kick?.schemaState === 'absent',
  temporaryWorkerAbsentBeforeDeploy: lifecycle.preExistingHttpStatus === 404,
  deploySucceeded: lifecycle.deployExitCode === 0 && lifecycle.secretExitCode === 0,
  preInspectSucceeded: lifecycle.preInspectHttpStatus === 200 && pre?.ok === true,
  preSchemaCompletelyAbsent: preState?.schema?.absent === true && preState?.schema?.partial === false,
  preHealthAvailable: preState?.operational?.healthSource === 'latest_snapshot' && preState?.operational?.healthEvidenceAvailable === true,
  preLeakageZero: numeric(preState?.providerLeakageRows, -1) === 0,
  firstApplySucceeded: lifecycle.firstApplyHttpStatus === 200 && first?.ok === true && first?.apply?.reason === 'applied',
  firstApplyStatementsExact: numeric(first?.apply?.metrics?.statementCount, -1) === contract.migration.statementCount,
  firstPostSchemaComplete: firstPost?.schema?.complete === true,
  secondApplySucceeded: lifecycle.secondApplyHttpStatus === 200 && second?.ok === true,
  secondApplyNoop: second?.apply?.reason === 'already-complete' && numeric(second?.apply?.metrics?.statementCount, -1) <= contract.migration.secondPassStatementCountMax,
  newNaturalSnapshotObserved: lifecycle.pollSucceeded === true,
  collectorLatencyWithinThreshold: latencyDeltaMs !== null && latencyDeltaMs <= contract.acceptanceThresholds.collectorLatencyDeltaMsMax,
  schemaSizeIncreaseWithinThreshold: sizeIncreaseBytes !== null && sizeIncreaseBytes <= contract.acceptanceThresholds.schemaSizeIncreaseBytesMax,
  workerWallWithinThreshold: numeric(first?.workerWallMs, Infinity) <= contract.acceptanceThresholds.schemaApplyWorkerWallMsMax,
  postSchemaComplete: postState?.schema?.complete === true,
  categoryDictionaryRowsZero: numeric(postState?.categoryDictionaryRows, -1) <= contract.acceptanceThresholds.categoryDictionaryRowsMax,
  reservedProbeRowsZero: numeric(postState?.reservedProbeRows, -1) <= contract.acceptanceThresholds.reservedProbeRowsMax,
  postLeakageZero: numeric(postState?.providerLeakageRows, -1) <= contract.acceptanceThresholds.providerLeakageRowsMax,
  twitchUntouchedByWorker: first?.boundaries?.twitchSchemaTouched === false,
  categoryCaptureStillDisabled: first?.boundaries?.categoryCaptureEnabled === false,
  productionCategoryRowsNotWritten: first?.boundaries?.productionCategoryRowsWrittenByWorker === false,
  temporaryWorkerDeleted: lifecycle.deleteExitCode === 0 && lifecycle.postDeleteHttpStatus === contract.acceptanceThresholds.postDeleteHttpStatus,
}

const kickRecoveryPass = Object.values(checks).every(Boolean) && parseErrors.length === 0
const evidence = {
  schemaVersion: 'viewloom-12a4-kick-category-schema-recovery-evidence-v1',
  workstream: contract.workstream,
  status: kickRecoveryPass ? 'observed_pass' : 'observed_failure',
  observedAt: new Date().toISOString(),
  execution: {
    event: readText('event-name.txt'),
    headSha: readText('head-sha.txt'),
    trigger,
    targetProvider: 'kick',
    twitchExecutionIncluded: false,
  },
  acceptedAudit: {
    acceptancePr: contract.acceptedAudit.acceptancePr,
    mergeSha: contract.acceptedAudit.mergeSha,
    twitchSchemaState: acceptedAudit?.providers?.twitch?.schemaState ?? null,
    kickSchemaState: acceptedAudit?.providers?.kick?.schemaState ?? null,
  },
  kick: {
    pre: preState,
    firstApply: first ? { apply: first.apply, workerWallMs: first.workerWallMs, boundaries: first.boundaries } : null,
    secondApply: second ? { apply: second.apply, workerWallMs: second.workerWallMs } : null,
    post: postState,
    lifecycle,
    measurements: {
      latencyBeforeMs,
      latencyAfterMs,
      latencyDeltaMs,
      databaseSizeBefore: sizeBefore,
      databaseSizeAfter: sizeAfter,
      schemaSizeIncreaseBytes: sizeIncreaseBytes,
      firstApplyStatementCount: numeric(first?.apply?.metrics?.statementCount),
      firstApplyDurationMs: numeric(first?.apply?.metrics?.durationMs),
      firstApplyRowsRead: numeric(first?.apply?.metrics?.rowsRead),
      firstApplyRowsWritten: numeric(first?.apply?.metrics?.rowsWritten),
      firstApplyChanges: numeric(first?.apply?.metrics?.changes),
      secondApplyStatementCount: numeric(second?.apply?.metrics?.statementCount),
    },
    runnerError: readText('runner-error.txt') || null,
    checks,
    providerGatePass: kickRecoveryPass,
  },
  parseErrors,
  gate: {
    kickRecoveryPass,
    twitchSchemaApplyAuthorized: false,
    categoryRuntimeEnablementAuthorized: false,
    boundedCategoryCostProbeAuthorizedByThisEvidence: false,
  },
  boundaries: contract.boundaries,
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputFile, kickRecoveryPass, parseErrors: parseErrors.length }, null, 2))
