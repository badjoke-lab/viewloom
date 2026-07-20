import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function main() {
  const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-permanent-category-observation-contract.json', 'utf8'))
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-twitch-permanent-category-observation/rollback')
  fs.mkdirSync(outputDir, { recursive: true })
  const startedAt = new Date().toISOString()
  const deployment = spawnSync('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', contract.rollback.config], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  const result = {
    schemaVersion: 'viewloom-12a4-twitch-permanent-category-observation-rollback-v1',
    provider: 'twitch',
    startedAt,
    deploymentExitCode: deployment.status ?? 1,
    attempts: [],
    finalObservation: null,
    pass: false,
    kickChanged: false,
  }

  if (result.deploymentExitCode === 0) {
    for (let attempt = 1; attempt <= 15; attempt += 1) {
      const attemptDir = path.join(outputDir, `attempt-${attempt}`)
      fs.mkdirSync(attemptDir, { recursive: true })
      const observed = runObserver(attemptDir, startedAt)
      result.attempts.push({
        attempt,
        observedAt: observed.observedAt ?? null,
        outcome: observed.outcome ?? 'rejected',
        normalPayloadRowsSinceStart: observed.data?.normalPayloadRowsSinceStart ?? null,
        providerLeakageRows: observed.data?.providerLeakageRows ?? null,
        bindingsPass: observed.gates?.bindingsPass ?? false,
        rollbackNormalSnapshotPass: observed.gates?.rollbackNormalSnapshotPass ?? false,
        error: observed.error ?? null,
      })
      result.finalObservation = observed
      if (observed.outcome === 'accepted') break
      if (attempt < 15) await sleep(60_000)
    }
  }

  result.pass = result.deploymentExitCode === 0
    && result.finalObservation?.outcome === 'accepted'
    && result.finalObservation?.gates?.bindingsPass === true
    && result.finalObservation?.gates?.rollbackNormalSnapshotPass === true
    && result.finalObservation?.gates?.providerLeakagePass === true
  result.completedAt = new Date().toISOString()
  fs.writeFileSync(path.join(outputDir, 'rollback-evidence.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result, null, 2))
  if (!result.pass) process.exitCode = 1
}

function runObserver(outputDir, startAt) {
  const run = spawnSync(process.execPath, ['scripts/run-12a4-twitch-permanent-category-observer.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, MODE: 'rollback', OUTPUT_DIR: outputDir, START_AT: startAt },
    maxBuffer: 20 * 1024 * 1024,
  })
  const file = path.join(outputDir, 'evidence-rollback.json')
  if (!fs.existsSync(file)) {
    return { outcome: 'rejected', gates: {}, data: {}, error: `observer_evidence_missing:${safe(run.stderr || run.stdout)}` }
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function safe(value) {
  return String(value ?? '').replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 320)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
