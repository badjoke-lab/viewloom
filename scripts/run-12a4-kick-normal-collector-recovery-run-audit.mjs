import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function execute() {
  const token = String(process.env.GITHUB_TOKEN ?? '').trim()
  const repository = String(process.env.GITHUB_REPOSITORY ?? '').trim()
  const workflowId = String(process.env.RECOVERY_WORKFLOW_ID ?? '').trim()
  const executionSha = String(process.env.RECOVERY_EXECUTION_SHA ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-normal-collector-recovery-run-audit')
  if (!token || !repository || !workflowId || !executionSha) throw new Error('run_audit_configuration_missing')

  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'ViewLoom recovery-run-audit',
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const runsBody = await githubJson(
    `https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(workflowId)}/runs?event=push&per_page=30`,
    headers,
  )
  const runs = Array.isArray(runsBody?.workflow_runs) ? runsBody.workflow_runs : []
  const run = runs.find((candidate) => candidate?.head_sha === executionSha) ?? null

  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-normal-collector-recovery-run-audit-v1',
    observedAt: new Date().toISOString(),
    repository,
    workflowId: Number(workflowId),
    expectedExecutionSha: executionSha,
    matchingRunFound: Boolean(run),
    run: run ? {
      id: run.id,
      runNumber: run.run_number,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
      headSha: run.head_sha,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      runStartedAt: run.run_started_at,
      attempt: run.run_attempt,
    } : null,
    jobs: [],
    artifacts: [],
    outcome: 'rejected',
    error: null,
  }

  try {
    if (!run) throw new Error('matching_recovery_push_run_not_found')
    const [jobsBody, artifactsBody] = await Promise.all([
      githubJson(`https://api.github.com/repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`, headers),
      githubJson(`https://api.github.com/repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`, headers),
    ])

    const jobs = Array.isArray(jobsBody?.jobs) ? jobsBody.jobs : []
    evidence.jobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      steps: Array.isArray(job.steps) ? job.steps.map((step) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number,
      })) : [],
    }))

    const artifacts = Array.isArray(artifactsBody?.artifacts) ? artifactsBody.artifacts : []
    evidence.artifacts = artifacts.map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      sizeInBytes: artifact.size_in_bytes,
      expired: artifact.expired,
      createdAt: artifact.created_at,
      digest: artifact.digest ?? null,
    }))
    evidence.outcome = 'accepted'
  } catch (error) {
    evidence.error = safeError(error)
    evidence.outcome = 'rejected'
  }

  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, 'run-audit.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('outcome', evidence.outcome)
  writeOutput('run_id', evidence.run?.id ?? '')
  writeOutput('evidence_path', outputPath)
  console.log(JSON.stringify(evidence, null, 2))
  if (evidence.outcome !== 'accepted') process.exit(1)
}

async function githubJson(url, headers) {
  const response = await fetch(url, { headers })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`github_api_failed_http_${response.status}`)
  return body
}

function safeError(error) {
  return String(error instanceof Error ? error.message : error)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
