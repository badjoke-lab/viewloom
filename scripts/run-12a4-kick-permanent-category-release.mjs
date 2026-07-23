import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectReleaseTrigger } from './inspect-12a4-kick-permanent-category-release-trigger.mjs'
import { evaluateReleaseStartWait } from './wait-12a4-kick-permanent-category-release-start.mjs'

const PREFLIGHT_LOOKBACK_MS = 30 * 60 * 1000

export function requiredReleaseGates(evidence) {
  return [
    evidence.triggerPass,
    evidence.preflight?.outcome === 'accepted',
    evidence.preflight?.data?.collectorErrorRunsSinceStart === 0,
    evidence.permanentDeploymentExitCode === 0,
    evidence.initialObservation?.outcome === 'accepted',
    evidence.initialObservation?.gates?.bindingsPass === true,
    evidence.initialObservation?.gates?.providerLeakagePass === true,
    evidence.initialObservation?.gates?.categorySnapshotPass === true,
    evidence.gates?.twitchChanged === false,
  ]
}

export function releaseAccepted(evidence) {
  return requiredReleaseGates(evidence).every(Boolean)
}

async function executeRelease() {
  const contractPath = 'docs/audits/12a4-kick-permanent-category-release-contract.json'
  const triggerPath = 'docs/audits/12a4-kick-permanent-category-release-trigger.json'
  const contract = json(contractPath)
  const gate = json(contract.acceptedPackage.canonicalGate)
  const trigger = json(triggerPath)
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? contract.evidence.artifactDirectory)
  fs.mkdirSync(outputDir, { recursive: true })

  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-permanent-category-release-start-evidence-v1',
    provider: 'kick',
    observedAt: new Date().toISOString(),
    trigger: sanitizeTrigger(trigger),
    triggerPass: false,
    wait: null,
    preflightWindowStartAt: null,
    preflight: null,
    activationStartedAt: null,
    permanentDeploymentExitCode: null,
    observationAttempts: [],
    initialObservation: null,
    rollback: {
      required: false,
      startedAt: null,
      deploymentExitCode: null,
      attempts: [],
      finalObservation: null,
      pass: false,
    },
    gates: {
      releaseAccepted: false,
      productionRuntimeCaptureStarted: false,
      twitchChanged: false,
      cadenceChanged: false,
      newWorkerCronAdded: false,
      backfillPerformed: false,
      retentionChanged: false,
      categoryUiChanged: false,
      crossProviderBehaviorChanged: false,
    },
    outcome: 'rejected',
    error: null,
  }

  try {
    const inspected = inspectReleaseTrigger({ trigger, contract, gate, eventName: 'push', now: new Date() })
    evidence.triggerPass = inspected.ok && inspected.action === 'start'
    if (!evidence.triggerPass) throw new Error(`trigger_rejected:${safeJson(inspected.failures)}`)

    evidence.wait = evaluateReleaseStartWait(trigger)
    if (!evidence.wait.ok || evidence.wait.waitMs !== 0) throw new Error('release_start_boundary_not_reached')

    evidence.preflightWindowStartAt = new Date(Date.now() - PREFLIGHT_LOOKBACK_MS).toISOString()
    evidence.preflight = runObserver({
      mode: 'preflight',
      outputDir: path.join(outputDir, 'preflight'),
      startAt: evidence.preflightWindowStartAt,
    })
    if (evidence.preflight.outcome !== 'accepted') throw new Error('fresh_preflight_rejected')
    if (evidence.preflight.data?.collectorErrorRunsSinceStart !== 0) {
      throw new Error(`recent_collector_errors:${evidence.preflight.data?.collectorErrorRunsSinceStart}`)
    }

    evidence.activationStartedAt = new Date().toISOString()
    const deployed = deploy(contract.acceptedPackage.permanentConfig)
    evidence.permanentDeploymentExitCode = deployed.code
    if (deployed.code !== 0) throw new Error(`permanent_deployment_failed:${safeText(deployed.output)}`)
    evidence.gates.productionRuntimeCaptureStarted = true

    for (let attempt = 1; attempt <= contract.initialVerification.pollAttempts; attempt += 1) {
      const observed = runObserver({
        mode: 'observe',
        outputDir: path.join(outputDir, `observe-${attempt}`),
        startAt: evidence.activationStartedAt,
      })
      evidence.observationAttempts.push({
        attempt,
        observedAt: observed.observedAt,
        outcome: observed.outcome,
        categoryPayloadRowsSinceStart: observed.data?.categoryPayloadRowsSinceStart ?? null,
        providerLeakageRows: observed.data?.providerLeakageRows ?? null,
        minutesSinceLatestCategorySnapshot: observed.data?.minutesSinceLatestCategorySnapshot ?? null,
        gates: observed.gates,
        error: observed.error,
      })
      evidence.initialObservation = observed
      if (observed.outcome === 'accepted') break
      if (attempt < contract.initialVerification.pollAttempts) {
        await sleep(contract.initialVerification.pollIntervalSeconds * 1000)
      }
    }

    evidence.gates.releaseAccepted = releaseAccepted(evidence)
    if (!evidence.gates.releaseAccepted) throw new Error('initial_category_snapshot_verification_failed')
    evidence.outcome = 'started'
  } catch (error) {
    evidence.error = safeError(error)
    if (evidence.gates.productionRuntimeCaptureStarted) {
      await rollback(evidence, contract, outputDir)
    }
  }

  evidence.observedAt = new Date().toISOString()
  const evidencePath = path.join(outputDir, 'evidence-release-start.json')
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('outcome', evidence.outcome)
  writeOutput('evidence_path', evidencePath)
  writeOutput('activation_started_at', evidence.activationStartedAt ?? '')
  console.log(JSON.stringify({
    evidencePath,
    outcome: evidence.outcome,
    triggerPass: evidence.triggerPass,
    preflightWindowStartAt: evidence.preflightWindowStartAt,
    preflightOutcome: evidence.preflight?.outcome ?? null,
    preflightCollectorErrors: evidence.preflight?.data?.collectorErrorRunsSinceStart ?? null,
    deploymentExitCode: evidence.permanentDeploymentExitCode,
    observationAttempts: evidence.observationAttempts.length,
    initialObservationOutcome: evidence.initialObservation?.outcome ?? null,
    rollback: evidence.rollback,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))
  if (evidence.outcome !== 'started') process.exitCode = 1
}

async function rollback(evidence, contract, outputDir) {
  evidence.rollback.required = true
  evidence.rollback.startedAt = new Date().toISOString()
  const deployed = deploy(contract.acceptedPackage.rollbackConfig)
  evidence.rollback.deploymentExitCode = deployed.code
  if (deployed.code !== 0) {
    evidence.rollback.finalObservation = { outcome: 'rejected', error: `rollback_deployment_failed:${safeText(deployed.output)}` }
    return
  }

  for (let attempt = 1; attempt <= contract.initialVerification.pollAttempts; attempt += 1) {
    const observed = runObserver({
      mode: 'rollback',
      outputDir: path.join(outputDir, `rollback-${attempt}`),
      startAt: evidence.rollback.startedAt,
    })
    evidence.rollback.attempts.push({
      attempt,
      observedAt: observed.observedAt,
      outcome: observed.outcome,
      normalPayloadRowsSinceStart: observed.data?.normalPayloadRowsSinceStart ?? null,
      providerLeakageRows: observed.data?.providerLeakageRows ?? null,
      gates: observed.gates,
      error: observed.error,
    })
    evidence.rollback.finalObservation = observed
    if (observed.outcome === 'accepted') break
    if (attempt < contract.initialVerification.pollAttempts) {
      await sleep(contract.initialVerification.pollIntervalSeconds * 1000)
    }
  }
  evidence.rollback.pass = evidence.rollback.deploymentExitCode === 0
    && evidence.rollback.finalObservation?.outcome === 'accepted'
    && evidence.rollback.finalObservation?.gates?.bindingsPass === true
    && evidence.rollback.finalObservation?.gates?.rollbackNormalSnapshotPass === true
    && evidence.rollback.finalObservation?.gates?.providerLeakagePass === true
  if (evidence.rollback.pass) evidence.gates.productionRuntimeCaptureStarted = false
}

function runObserver({ mode, outputDir, startAt }) {
  fs.mkdirSync(outputDir, { recursive: true })
  const result = spawnSync(process.execPath, ['scripts/run-12a4-kick-permanent-category-observer.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      MODE: mode,
      OUTPUT_DIR: outputDir,
      START_AT: startAt,
    },
    maxBuffer: 20 * 1024 * 1024,
  })
  const evidencePath = path.join(outputDir, `evidence-${mode}.json`)
  if (!fs.existsSync(evidencePath)) {
    return {
      schemaVersion: 'observer-evidence-missing',
      mode,
      outcome: 'rejected',
      gates: {},
      data: {},
      error: `observer_evidence_missing:${safeText(result.stderr || result.stdout)}`,
    }
  }
  return json(evidencePath)
}

function deploy(configPath) {
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', configPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  return {
    code: result.status ?? 1,
    output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
  }
}

function sanitizeTrigger(trigger) {
  return {
    schemaVersion: trigger.schemaVersion,
    status: trigger.status,
    provider: trigger.provider,
    oneTime: trigger.oneTime,
    implementationPr: trigger.implementationPr,
    implementationMergeSha: trigger.implementationMergeSha,
    acceptancePr: trigger.acceptancePr,
    acceptanceMergeSha: trigger.acceptanceMergeSha,
    releasePackagePr: trigger.releasePackagePr,
    releasePackageMergeSha: trigger.releasePackageMergeSha,
    startAt: trigger.startAt,
  }
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function safeText(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .slice(0, 320)
}

function safeJson(value) {
  return safeText(JSON.stringify(value ?? null))
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : error)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  executeRelease().catch((error) => {
    console.error(safeError(error))
    process.exit(1)
  })
}