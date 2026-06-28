import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const root = resolve(process.env.HISTORY_H6_ARTIFACT_DIR ?? 'artifacts/history-ui-h6')
const candidateHead = process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null

assert.ok(candidateHead, 'P9H6 candidate head is missing')

const contracts = [
  { phase: 'P9H1', schema: 'viewloom-history-ui-h1-metric-v1', scenarios: 2, path: 'h1/history-ui-h1-evidence.json' },
  { phase: 'P9H2', schema: 'viewloom-history-ui-h2-chart-v1', scenarios: 2, path: 'h2/history-ui-h2-chart-evidence.json' },
  { phase: 'P9H3', schema: 'viewloom-history-ui-h3-overview-v1', scenarios: 2, path: 'h3/history-ui-h3-overview-evidence.json' },
  { phase: 'P9H4A', schema: 'viewloom-history-ui-h4a-overview-balance-v1', scenarios: 6, path: 'h4a/history-ui-h4a-overview-evidence.json' },
  { phase: 'P9H4B', schema: 'viewloom-history-ui-h4b-tasks-v1', scenarios: 4, path: 'h4b/history-ui-h4b-tasks-evidence.json' },
  { phase: 'P9H5', schema: 'viewloom-history-ui-h5-responsive-v1', scenarios: 5, path: 'h5/history-ui-h5-responsive-evidence.json' },
]

const phases = contracts.map((contract) => {
  const absolute = join(root, contract.path)
  const bytes = readFileSync(absolute)
  const evidence = JSON.parse(bytes.toString('utf8'))

  assert.equal(evidence.schema, contract.schema, `${contract.phase}: evidence schema changed`)
  assert.equal(evidence.phase, contract.phase, `${contract.phase}: phase label changed`)
  assert.equal(evidence.result, 'pass', `${contract.phase}: evidence did not pass`)
  assert.equal(evidence.candidateHead, candidateHead, `${contract.phase}: candidate head mismatch`)
  assert.equal(evidence.scenarios.length, contract.scenarios, `${contract.phase}: scenario count changed`)

  for (const scenario of evidence.scenarios) {
    assert.ok(scenario.provider === 'twitch' || scenario.provider === 'kick', `${contract.phase}: provider missing from scenario`)
    assert.ok(Array.isArray(scenario.calls), `${contract.phase}: request evidence missing`)
    assert.ok(scenario.calls.length >= 1, `${contract.phase}: scenario has no History request`)
    assert.ok(scenario.calls.every((call) => call.provider === scenario.provider), `${contract.phase}: crossed provider endpoint`)
  }

  return {
    phase: contract.phase,
    schema: contract.schema,
    evidencePath: contract.path,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    scenarios: evidence.scenarios.map((scenario) => scenario.id),
    providers: [...new Set(evidence.scenarios.map((scenario) => scenario.provider))].sort(),
    requestCount: evidence.scenarios.reduce((total, scenario) => total + scenario.calls.length, 0),
  }
})

const manifest = {
  schema: 'viewloom-history-ui-h6-candidate-v1',
  phase: 'P9H6',
  candidateHead,
  builtAt: new Date().toISOString(),
  source: 'deterministic-local-preview',
  result: 'pass',
  phaseCount: phases.length,
  scenarioCount: phases.reduce((total, phase) => total + phase.scenarios.length, 0),
  providers: ['kick', 'twitch'],
  invariants: {
    oneExactHead: true,
    oneBuild: true,
    oneLocalPreview: true,
    providerSeparated: true,
    noRuntimeContractChange: true,
    nextPhaseRequiresExplicitContinuation: true,
  },
  phases,
}

const manifestPath = join(root, 'history-ui-h6-candidate-manifest.json')
mkdirSync(dirname(manifestPath), { recursive: true })
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(JSON.stringify({
  result: manifest.result,
  candidateHead: manifest.candidateHead,
  phases: manifest.phaseCount,
  scenarios: manifest.scenarioCount,
  manifestPath,
}, null, 2))
