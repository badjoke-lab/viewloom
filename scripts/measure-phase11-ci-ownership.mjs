import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

const workflowDir = '.github/workflows'
const outputPath = process.argv[2] || 'artifacts/phase11-ci-ownership/ci-ownership.json'
const files = readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name)).sort()

const workflows = files.map((file) => {
  const path = join(workflowDir, file)
  const source = readFileSync(path, 'utf8')
  const lines = source.split(/\r?\n/)
  const name = lines.find((line) => /^name:\s*/.test(line))?.replace(/^name:\s*/, '').trim() || file
  const hasPullRequest = /(^|\n)\s{0,2}pull_request:\s*(\n|$)/.test(source)
  const hasPush = /(^|\n)\s{0,2}push:\s*(\n|$)/.test(source)
  const hasSchedule = /(^|\n)\s{0,2}schedule:\s*(\n|$)/.test(source)
  const hasDispatch = /(^|\n)\s{0,2}workflow_dispatch:\s*(\n|$)/.test(source)
  const hasConcurrency = /(^|\n)concurrency:\s*(\n|$)/.test(source)
  const cancelsInProgress = /cancel-in-progress:\s*true/.test(source)
  const pathEntries = lines.filter((line) => /^\s+-\s+['"][^'"]+['"]\s*$/.test(line)).map((line) => line.trim().replace(/^-\s+/, '').replace(/^['"]|['"]$/g, ''))
  const stepNames = lines.filter((line) => /^\s+-\s+name:\s*/.test(line)).map((line) => line.replace(/^\s+-\s+name:\s*/, '').trim())
  const jobNames = lines.filter((line) => /^\s{2}[A-Za-z0-9_-]+:\s*$/.test(line)).map((line) => line.trim().slice(0, -1)).filter((name) => !['pull_request', 'push', 'schedule', 'workflow_dispatch', 'paths', 'branches'].includes(name))

  return {
    file,
    name,
    triggers: {
      pullRequest: hasPullRequest,
      push: hasPush,
      schedule: hasSchedule,
      workflowDispatch: hasDispatch,
    },
    concurrency: {
      present: hasConcurrency,
      cancelInProgress: cancelsInProgress,
    },
    pathEntries,
    jobs: [...new Set(jobNames)],
    stepNames,
  }
})

const prWorkflows = workflows.filter((item) => item.triggers.pullRequest)
const missingCancellation = prWorkflows.filter((item) => !item.concurrency.present || !item.concurrency.cancelInProgress).map((item) => item.file)
const duplicateStepOwners = new Map()
for (const workflow of workflows) {
  for (const step of workflow.stepNames) {
    const owners = duplicateStepOwners.get(step) || []
    owners.push(workflow.file)
    duplicateStepOwners.set(step, owners)
  }
}
const repeatedSteps = [...duplicateStepOwners.entries()]
  .filter(([, owners]) => owners.length > 1)
  .map(([step, owners]) => ({ step, owners: owners.sort() }))
  .sort((a, b) => b.owners.length - a.owners.length || a.step.localeCompare(b.step))

const evidence = {
  schema: 'viewloom-phase11-ci-ownership-v1',
  phase: 'Phase 11',
  workstream: 'P11B',
  generatedAt: new Date().toISOString(),
  counts: {
    workflows: workflows.length,
    pullRequestWorkflows: prWorkflows.length,
    scheduledWorkflows: workflows.filter((item) => item.triggers.schedule).length,
    workflowsMissingLatestHeadCancellation: missingCancellation.length,
    repeatedNamedSteps: repeatedSteps.length,
  },
  missingLatestHeadCancellation: missingCancellation,
  repeatedNamedSteps: repeatedSteps,
  workflows,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify(evidence.counts, null, 2))
