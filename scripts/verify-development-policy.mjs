import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const required = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/category-capture-permanent-rollout-spec.md',
  'docs/product/category-capture-permanent-rollout-plan.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/product/heatmap-canvas-redesign-spec.md',
  'docs/product/heatmap-canvas-implementation-plan.md',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json',
  '.github/pull_request_template.md',
]

for (const path of required) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const agents = read('AGENTS.md')
const contributing = read('CONTRIBUTING.md')
const docsIndex = read('docs/README.md')
const policy = read('docs/operations/development-and-deployment-policy.md')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')
const prTemplate = read('.github/pull_request_template.md')
const gate = json('docs/audits/12a2-current-gate-state.json')

for (const fragment of [
  'Mandatory current authorities',
  'Do not rely on a cached handoff',
  'Current execution order',
]) assert.ok(agents.includes(fragment), `AGENTS missing: ${fragment}`)

for (const fragment of [
  'Required reading and freshness rule',
  'Every PR must record the Current-main SHA',
  'If the documents disagree',
]) assert.ok(contributing.includes(fragment), `CONTRIBUTING missing: ${fragment}`)

for (const fragment of [
  'Read the following from current `main`',
  'Work allowed before the audit boundary',
  'Before every task and again before merge',
]) assert.ok(docsIndex.includes(fragment), `docs index missing: ${fragment}`)

for (const fragment of [
  'Mandatory freshness protocol',
  'Cached chat summaries',
  'Before marking a PR ready or merging',
  'Repair stale/conflicting source-of-truth documents before implementation',
  '`main` is production',
  'Provider separation and data truth',
]) assert.ok(policy.includes(fragment), `development policy missing: ${fragment}`)

for (const fragment of [
  'Active deliverables before 2026-08-05',
  'Track A — replacement audit readiness',
  'Track B — Heatmap Canvas redesign',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  'Current-main SHA read:',
  'No newer source-of-truth change supersedes this candidate',
  'The active working note and current schedule remain accurate',
]) assert.ok(prTemplate.includes(fragment), `PR template missing: ${fragment}`)

assert.ok(schedule.includes('2026-07-30 through 2026-07-31 — #659 package first'))
assert.ok(schedule.includes('Reread current roadmap, schedule, gate, affected specs, and active WIP before each new branch and before each merge.'))

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  phase: gate.currentWorkstream.phase,
  gate: gate.schemaVersion,
  publicCategoryFilterAuthorized: false,
}, null, 2))
