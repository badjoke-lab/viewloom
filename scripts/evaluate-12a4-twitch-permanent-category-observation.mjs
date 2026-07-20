import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function evaluateObservation({ evidence, contract, now = new Date() }) {
  const startMs = Date.parse(contract.startAt)
  const minimumEndMs = Date.parse(contract.minimumEndAt)
  const warningEndMs = Date.parse(contract.warningEndAt)
  const nowMs = now.getTime()
  const cadenceMinutes = Number(String(contract.collectorCron).match(/\*\/(\d+)/)?.[1] ?? 5)
  const elapsedMinutes = Math.max(0, (nowMs - startMs) / 60_000)
  const expectedRows = Math.max(2, Math.floor(elapsedMinutes / cadenceMinutes))
  const categoryRows = Number(evidence?.data?.categoryPayloadRowsSinceStart ?? 0)
  const coverageRatio = expectedRows > 0 ? Math.min(1, categoryRows / expectedRows) : 0
  const collectorErrors = Number(evidence?.data?.collectorErrorRunsSinceStart ?? 0)
  const leakageRows = Number(evidence?.data?.providerLeakageRows ?? Number.POSITIVE_INFINITY)
  const storage = evidence?.storage ?? {}
  const bindings = evidence?.bindings ?? {}
  const gates = evidence?.gates ?? {}
  const hardStops = []
  const warnings = []
  const hardStop = (name, condition, actual = undefined) => {
    if (condition) hardStops.push({ name, actual })
  }
  const warn = (name, condition, actual = undefined) => {
    if (condition) warnings.push({ name, actual })
  }

  hardStop('observer rejected', evidence?.outcome !== 'accepted', evidence?.outcome)
  hardStop('permanent flag disabled', bindings.permanentCaptureEnabled !== true, bindings)
  hardStop('obsolete canary binding present', bindings.obsoleteCanaryBindingsPresent === true, bindings)
  hardStop('provider leakage', leakageRows > contract.healthyGates.providerLeakageRowsMax, leakageRows)
  hardStop('storage gate failed', gates.storagePass !== true || storage.providerPass !== true || storage.accountPass !== true, storage)
  hardStop('latest snapshot freshness failed', gates.latestSnapshotFreshnessPass !== true, evidence?.data?.minutesSinceLatestSnapshot)
  hardStop('latest snapshot not real', gates.latestSnapshotRealPass !== true, evidence?.data?.latestSnapshot?.source_mode)
  hardStop('latest snapshot empty', gates.latestSnapshotNonemptyPass !== true, evidence?.data?.latestSnapshot?.stream_count)
  hardStop('category coverage below hard stop', elapsedMinutes >= 30 && coverageRatio < 0.8, coverageRatio)
  hardStop('repeated collector errors', collectorErrors >= contract.healthyGates.hardStopCollectorErrorRunsMin, collectorErrors)

  warn('category coverage below warning', elapsedMinutes >= 30 && coverageRatio < contract.healthyGates.warningCategoryCoverageRatio, coverageRatio)
  warn('collector errors observed', collectorErrors > contract.healthyGates.warningCollectorErrorRunsMax, collectorErrors)

  const minimumReached = Number.isFinite(minimumEndMs) && nowMs >= minimumEndMs
  const warningEndReached = Number.isFinite(warningEndMs) && nowMs >= warningEndMs
  const healthy = hardStops.length === 0 && warnings.length === 0
  const classification = hardStops.length > 0
    ? 'hard_stop'
    : warnings.length > 0
      ? warningEndReached ? 'warning_closeout_required' : 'warning'
      : minimumReached ? 'eligible_for_acceptance' : 'healthy'

  return {
    schemaVersion: 'viewloom-12a4-twitch-permanent-category-observation-evaluation-v1',
    provider: 'twitch',
    evaluatedAt: now.toISOString(),
    startAt: contract.startAt,
    minimumEndAt: contract.minimumEndAt,
    warningEndAt: contract.warningEndAt,
    elapsedMinutes: round(elapsedMinutes),
    cadenceMinutes,
    expectedCategoryRows: expectedRows,
    observedCategoryRows: categoryRows,
    categoryCoverageRatio: round(coverageRatio, 4),
    collectorErrorRunsSinceStart: collectorErrors,
    providerLeakageRows: leakageRows,
    permanentCaptureEnabled: bindings.permanentCaptureEnabled === true,
    storage,
    latestSnapshot: evidence?.data?.latestSnapshot ?? null,
    gates,
    hardStops,
    warnings,
    healthy,
    minimumReached,
    warningEndReached,
    classification,
    rollbackRequired: hardStops.length > 0,
    kickChanged: false,
  }
}

function round(value, digits = 2) {
  const scale = 10 ** digits
  return Math.round(Number(value) * scale) / scale
}

function main() {
  const evidencePath = argument('--evidence') ?? process.env.OBSERVATION_EVIDENCE
  const outputPath = argument('--output') ?? process.env.OBSERVATION_EVALUATION ?? 'artifacts/12a4-twitch-permanent-category-observation/evaluation.json'
  if (!evidencePath || !fs.existsSync(evidencePath)) throw new Error('observation_evidence_missing')
  const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-permanent-category-observation-contract.json', 'utf8'))
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
  const evaluation = evaluateObservation({ evidence, contract })
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(evaluation, null, 2)}\n`)
  console.log(JSON.stringify(evaluation, null, 2))
  writeOutput('classification', evaluation.classification)
  writeOutput('rollback_required', String(evaluation.rollbackRequired))
  writeOutput('evaluation_path', outputPath)
  if (evaluation.rollbackRequired) process.exitCode = 2
}

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
