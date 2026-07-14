import fs from 'node:fs'
import path from 'node:path'

const [rawDir, outputFile] = process.argv.slice(2)
if (!rawDir || !outputFile) {
  console.error('usage: node collect-12a4-category-controlled-schema-apply-evidence.mjs <raw-dir> <output-file>')
  process.exit(2)
}

const parseErrors = []
const readJson = (name, fallback = null) => {
  const file = path.join(rawDir, name)
  if (!fs.existsSync(file)) return fallback
  const text = fs.readFileSync(file, 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    parseErrors.push({
      file: name,
      error: error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180),
      preview: text.trim().replace(/\s+/g, ' ').slice(0, 120),
    })
    return fallback
  }
}
const readText = (name, fallback = '') => {
  const file = path.join(rawDir, name)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : fallback
}
const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-category-controlled-schema-apply-execution-contract.json', 'utf8'))
const trigger = readJson('trigger.json')
const designPr = readJson('design-pr.json')
const packagePr = readJson('package-pr.json')
const executionStatus = readJson('execution-status.json', {})
const headSha = readText('head-sha.txt')
const eventName = readText('event-name.txt')

const timestamp = (value) => {
  const parsed = Date.parse(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : null
}
const nonNegative = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}
const snapshotLatency = (snapshot) => {
  const bucket = timestamp(snapshot?.bucket_minute)
  const collected = timestamp(snapshot?.collected_at)
  return bucket !== null && collected !== null ? Math.max(0, collected - bucket) : null
}

const providers = {}
for (const provider of contract.providers.order) {
  const expected = contract.providers[provider]
  const pre = readJson(`${provider}-pre.json`)
  const first = readJson(`${provider}-first-apply.json`)
  const second = readJson(`${provider}-second-apply.json`)
  const post = readJson(`${provider}-post.json`)
  const lifecycle = readJson(`${provider}-lifecycle.json`, {})
  const attempted = Boolean(executionStatus?.providers?.[provider]?.attempted)

  const preState = pre?.state ?? first?.pre ?? null
  const firstPost = first?.post ?? null
  const postState = post?.state ?? firstPost ?? null
  const preLatestAt = timestamp(preState?.operational?.latestSnapshot?.collected_at)
  const postLatestAt = timestamp(postState?.operational?.latestSnapshot?.collected_at)
  const collectorLatencyBeforeMs = snapshotLatency(preState?.operational?.latestSnapshot)
  const collectorLatencyAfterMs = snapshotLatency(postState?.operational?.latestSnapshot)
  const collectorLatencyDeltaMs = collectorLatencyBeforeMs !== null && collectorLatencyAfterMs !== null
    ? Math.abs(collectorLatencyAfterMs - collectorLatencyBeforeMs)
    : null
  const databaseSizeBefore = nonNegative(preState?.databaseSizeBytes)
  const databaseSizeAfter = nonNegative(postState?.databaseSizeBytes ?? firstPost?.databaseSizeBytes)
  const schemaSizeIncreaseBytes = databaseSizeBefore !== null && databaseSizeAfter !== null
    ? Math.max(0, databaseSizeAfter - databaseSizeBefore)
    : null

  const checks = {
    attempted,
    deploySucceeded: lifecycle.deployExitCode === 0 && lifecycle.secretExitCode === 0,
    preInspectSucceeded: lifecycle.preCurlExitCode === 0 && lifecycle.preHttpStatus === 200 && pre?.ok === true,
    preSchemaCompletelyAbsent: preState?.schema?.absent === true && preState?.schema?.partial === false,
    providerHealthSourceMatches: preState?.operational?.healthSource === expected.healthSource,
    providerHealthEvidencePresent: preState?.operational?.healthEvidenceAvailable === true,
    preProviderLeakageZero: Number(preState?.providerLeakageRows ?? -1) === 0,
    firstApplySucceeded: lifecycle.firstCurlExitCode === 0 && lifecycle.firstHttpStatus === 200 && first?.ok === true,
    firstApplyStatementsExact: Number(first?.apply?.metrics?.statementCount ?? -1) === contract.acceptanceThresholds.schemaApplyStatementsPerProvider,
    firstApplyReasonApplied: first?.apply?.reason === 'applied' && first?.apply?.applied === true,
    postSchemaComplete: firstPost?.schema?.complete === true && postState?.schema?.complete === true,
    secondApplySucceeded: lifecycle.secondCurlExitCode === 0 && lifecycle.secondHttpStatus === 200 && second?.ok === true,
    secondApplyNoop: second?.apply?.reason === 'already-complete' && Number(second?.apply?.metrics?.statementCount ?? -1) <= contract.acceptanceThresholds.secondPassStatementCountMax,
    newNaturalSnapshotObserved: lifecycle.pollSucceeded === true && preLatestAt !== null && postLatestAt !== null && postLatestAt > preLatestAt,
    collectorLatencyDeltaWithinThreshold: collectorLatencyDeltaMs !== null && collectorLatencyDeltaMs <= contract.acceptanceThresholds.collectorLatencyDeltaMsPerProviderMax,
    schemaSizeIncreaseWithinThreshold: schemaSizeIncreaseBytes !== null && schemaSizeIncreaseBytes <= contract.acceptanceThresholds.schemaSizeIncreaseBytesPerProviderMax,
    workerWallWithinThreshold: Number(first?.workerWallMs ?? Infinity) <= contract.acceptanceThresholds.schemaApplyWorkerWallMsPerProviderMax,
    categoryDictionaryRowsZero: Number(postState?.categoryDictionaryRows ?? -1) <= contract.acceptanceThresholds.categoryDictionaryRowsMax,
    reservedProbeRowsZero: Number(postState?.reservedProbeRows ?? -1) <= contract.acceptanceThresholds.reservedProbeRowsMax,
    postProviderLeakageZero: Number(postState?.providerLeakageRows ?? -1) <= contract.acceptanceThresholds.providerLeakageRowsMax,
    temporaryWorkerDeleted: lifecycle.deleteExitCode === 0 && lifecycle.deleteCurlExitCode === 0 && lifecycle.deleteHttpStatus === contract.acceptanceThresholds.postDeleteHttpStatus,
  }

  providers[provider] = {
    provider,
    expectedHealthSource: expected.healthSource,
    attempted,
    pre: preState ? {
      schema: preState.schema,
      operational: preState.operational,
      providerLeakageRows: preState.providerLeakageRows,
      categoryDictionaryRows: preState.categoryDictionaryRows,
      reservedProbeRows: preState.reservedProbeRows,
      databaseSizeBytes: preState.databaseSizeBytes,
      query: preState.query,
    } : null,
    firstApply: first ? {
      apply: first.apply,
      workerWallMs: first.workerWallMs,
    } : null,
    secondApply: second ? {
      apply: second.apply,
      workerWallMs: second.workerWallMs,
    } : null,
    post: postState ? {
      schema: postState.schema,
      operational: postState.operational,
      providerLeakageRows: postState.providerLeakageRows,
      categoryDictionaryRows: postState.categoryDictionaryRows,
      reservedProbeRows: postState.reservedProbeRows,
      databaseSizeBytes: postState.databaseSizeBytes,
      query: postState.query,
    } : null,
    measurements: {
      databaseSizeBefore,
      databaseSizeAfter,
      schemaSizeIncreaseBytes,
      collectorLatencyBeforeMs,
      collectorLatencyAfterMs,
      collectorLatencyDeltaMs,
      schemaApplyStatementCount: nonNegative(first?.apply?.metrics?.statementCount),
      schemaApplyDurationMs: nonNegative(first?.apply?.metrics?.durationMs),
      schemaApplyRowsRead: nonNegative(first?.apply?.metrics?.rowsRead),
      schemaApplyRowsWritten: nonNegative(first?.apply?.metrics?.rowsWritten),
      schemaApplyChanges: nonNegative(first?.apply?.metrics?.changes),
      schemaApplyWorkerWallMs: nonNegative(first?.workerWallMs),
      secondPassStatementCount: nonNegative(second?.apply?.metrics?.statementCount),
    },
    lifecycle,
    parseErrors: parseErrors.filter((entry) => entry.file.startsWith(`${provider}-`)),
    checks,
    providerGatePass: Object.values(checks).every(Boolean),
  }
}

const twitchPass = providers.twitch?.providerGatePass === true
const kickPass = providers.kick?.providerGatePass === true
const evidence = {
  schemaVersion: 'viewloom-12a4-category-controlled-schema-apply-evidence-v1',
  workstream: contract.workstream,
  status: twitchPass && kickPass ? 'observed_pass' : 'observed_failure',
  observedAt: new Date().toISOString(),
  providerSeparated: true,
  execution: {
    event: eventName,
    headSha,
    designPr: contract.design.pr,
    designMerged: Boolean(designPr?.merged_at && designPr?.merge_commit_sha),
    designMergeSha: designPr?.merge_commit_sha ?? null,
    packagePr: trigger?.packagePr ?? null,
    packageMerged: Boolean(packagePr?.merged_at && packagePr?.merge_commit_sha),
    packageHeadSha: packagePr?.head?.sha ?? null,
    packageMergeSha: packagePr?.merge_commit_sha ?? null,
    trigger: trigger ? {
      schemaVersion: trigger.schemaVersion,
      status: trigger.status,
      confirmation: trigger.confirmation,
      oneTime: trigger.oneTime,
      expectedPackageHeadSha: trigger.expectedPackageHeadSha,
    } : null,
    providerOrder: contract.providers.order,
    stopAfterFirstProviderFailure: contract.providers.stopAfterFirstProviderFailure,
  },
  providers,
  parseErrors,
  gate: {
    designAccepted: contract.design.accepted === true,
    acceptedReadOnlyPreflight: contract.acceptedPreflight.twitchGatePass === true && contract.acceptedPreflight.kickGatePass === true,
    twitchGatePass: twitchPass,
    kickGatePass: kickPass,
    controlledSchemaApplyPass: twitchPass && kickPass,
    categoryRuntimeEnablementAuthorized: false,
    boundedCategoryCostProbeAuthorizedByThisEvidence: false,
  },
  privacy: contract.evidencePrivacy,
  failurePolicy: contract.failurePolicy,
  boundaries: {
    categoryRuntimeEnabled: false,
    productionCategoryRowsWritten: false,
    probeRowsWritten: false,
    newCronAdded: false,
    backfillPerformed: false,
    rawRetentionChanged: false,
    categoryAnalyticsUiAdded: false,
    crossProviderCategoryIdentityCreated: false,
    combinedProviderCategoryRankingCreated: false,
  },
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputFile, controlledSchemaApplyPass: evidence.gate.controlledSchemaApplyPass, parseErrors: parseErrors.length }, null, 2))
