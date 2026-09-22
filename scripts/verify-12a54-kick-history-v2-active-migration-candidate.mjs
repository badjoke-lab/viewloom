import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const evidence = JSON.parse(fs.readFileSync('docs/audits/12a54-kick-history-v2-active-migration-candidate.json', 'utf8'))
const decision = JSON.parse(fs.readFileSync('docs/audits/12a53-kick-history-v2-active-migration-candidate-decision.json', 'utf8'))
const dormant = JSON.parse(fs.readFileSync('docs/audits/12a52-kick-history-v2-dormant-generator-package.json', 'utf8'))
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const resolverSource = fs.readFileSync('workers/collector-kick/src/history-category-generation-engine.ts', 'utf8')
const wrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function assert(value, message) {
  if (!value) throw new Error(message)
}

assert(evidence.schemaVersion === 'viewloom-12a54-kick-history-v2-active-migration-candidate-v1', 'schema')
assert(evidence.phase === '12A-54' && evidence.issue === 1020 && evidence.provider === 'kick', 'identity')
assert(evidence.status === 'draft_candidate_only_merge_and_production_forbidden', 'status')
assert(evidence.sourceDecision.phase === '12A-53', 'source decision phase')
assert(evidence.sourceDecision.pr === 1019, 'source decision PR')
assert(evidence.sourceDecision.mergeSha === '84de5ad01681bc1cd31a518011eea8fc0450a8a8', 'source decision merge')
assert(decision.status === 'separate_draft_candidate_gate_go_active_change_still_forbidden', '12A53 decision status')
assert(decision.authorization.openSeparateDraftCandidateGate === true, '12A53 next-gate authority')
assert(decision.authorization.activeCollectorModificationInThisDecision === false, '12A53 active-change boundary')
assert(dormant.phase === '12A-52' && dormant.status === 'dormant_repository_package', '12A52 dormant package')
assert(dormant.authorization.productionV2GeneratorWiring === false, '12A52 production wiring boundary')

const { resolveKickHistoryCategoryGenerationEngine } = await import('../workers/collector-kick/src/history-category-generation-engine.ts')
for (const row of evidence.requiredRuntimeMatrix) {
  const master = row.master === null ? undefined : row.master
  const selector = row.selector === null ? undefined : row.selector
  const actual = resolveKickHistoryCategoryGenerationEngine(master, selector)
  assert(actual === row.expected, `runtime matrix mismatch: ${JSON.stringify(row)} -> ${actual}`)
}
for (const selector of ['', ' ', ' v1', 'v1 ', 'V1', 'V2', 'invalid']) {
  assert(resolveKickHistoryCategoryGenerationEngine('true', selector) === 'none', `non-exact selector must fail closed: ${JSON.stringify(selector)}`)
}
for (const master of [undefined, '', 'false', 'TRUE', ' true']) {
  assert(resolveKickHistoryCategoryGenerationEngine(master, 'v2') === 'none', `non-exact master enable must fail closed: ${JSON.stringify(master)}`)
}

assert(resolverSource.includes("export type KickHistoryCategoryGenerationEngine = 'v1' | 'v2' | 'none'"), 'resolver output type')
assert(resolverSource.includes("if (masterEnabled !== 'true') return 'none'"), 'master fail-close')
assert(resolverSource.includes("if (selector === undefined) return 'v1'"), 'absent selector legacy v1')
assert(resolverSource.includes("if (selector === 'v1') return 'v1'"), 'v1 selector')
assert(resolverSource.includes("if (selector === 'v2') return 'v2'"), 'v2 selector')
assert(resolverSource.trim().endsWith("return 'none'\n}"), 'invalid selector fail-close')

assert(entry.includes("import { maybeRunKickHistoryCategoryPermanentIntegration } from '../../dormant/history-category-aggregate-integration'"), 'v1 adapter import')
assert(entry.includes("import { maybeGenerateKickHistoryCategoryV2Dormant } from '../../dormant/history-category-v2-generator'"), 'v2 adapter import')
assert(entry.includes("import { resolveKickHistoryCategoryGenerationEngine } from './history-category-generation-engine'"), 'resolver import')
assert(entry.includes('HISTORY_CATEGORY_GENERATION_ENGINE?: string'), 'selector env field')
assert(entry.includes('resolveKickHistoryCategoryGenerationEngine(\n            env.HISTORY_CATEGORY_GENERATION_ENABLED,\n            env.HISTORY_CATEGORY_GENERATION_ENGINE,'), 'resolver wiring')
assert(entry.includes("if (historyCategoryEngine === 'v1')"), 'v1 branch')
assert(entry.includes("} else if (historyCategoryEngine === 'v2')"), 'v2 branch')
assert((entry.match(/await maybeRunKickHistoryCategoryPermanentIntegration\(/g) ?? []).length === 1, 'v1 adapter call count')
assert((entry.match(/await maybeGenerateKickHistoryCategoryV2Dormant\(/g) ?? []).length === 1, 'v2 adapter call count')
assert(!entry.includes('Promise.all(['), 'no concurrent dual-engine execution')
assert((entry.match(/startDay: historyCategoryStartDay/g) ?? []).length === 2, 'shared startDay must reach both exclusive branches')
assert(entry.includes("reason: 'invalid_generation_engine_selector'"), 'invalid-selector audit log')
assert(!entry.includes('HISTORY_CATEGORY_V2_GENERATION_ENABLED'), 'independent v2 enable forbidden')
assert(!entry.includes('HISTORY_CATEGORY_V2_START_DAY'), 'independent v2 startDay forbidden')

assert(wrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'production master enable drift')
assert(wrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'production startDay drift')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'production cron drift')
assert(!wrangler.includes('HISTORY_CATEGORY_GENERATION_ENGINE'), 'production selector must remain unconfigured')

assert(evidence.implementation.activeWranglerChanged === false, 'evidence wrangler boundary')
assert(evidence.implementation.newCron === false, 'evidence cron boundary')
assert(evidence.implementation.backfill === false && evidence.implementation.manualGeneration === false, 'backfill/manual boundary')
assert(evidence.implementation.rawRetentionChange === false, 'retention boundary')
assert(evidence.implementation.d1SchemaChange === false, 'D1 schema boundary')
assert(evidence.implementation.apiUiChange === false, 'API/UI boundary')
assert(evidence.implementation.twitchChange === false && evidence.implementation.crossProviderChange === false, 'provider boundary')

for (const [key, value] of Object.entries(evidence.productionBoundary)) {
  if (key === 'candidateMustRemainDraft' || key === 'activeProductionConfigMustRemainV1Only') {
    assert(value === true, `production boundary must be true: ${key}`)
  } else {
    assert(value === false, `production authority must remain false: ${key}`)
  }
}
assert(evidence.nextGate.startsWith('After this Draft candidate is green and frozen'), 'next gate')

const planOutput = execFileSync(process.execPath, ['scripts/plan-collector-worker-deploy.mjs'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_EVENT_BEFORE: '',
    DEPLOY_PROVIDER: '',
    GITHUB_OUTPUT: '',
  },
})
const plan = JSON.parse(planOutput)
assert(plan.eventName === 'pull_request', 'planner event')
assert(plan.deployTwitch === false && plan.deployKick === false && plan.anyDeploy === false, 'PR planner must not deploy production')

console.log(JSON.stringify({
  ok: true,
  phase: evidence.phase,
  issue: evidence.issue,
  selector: evidence.candidateContract.engineSelector,
  defaultWhenEnabled: evidence.candidateContract.selectorAbsent,
  invalidSelector: evidence.candidateContract.selectorInvalid,
  mutuallyExclusive: evidence.candidateContract.mutuallyExclusive,
  productionConfigChanged: false,
  pullRequestDeployPlan: plan,
  candidateMustRemainDraft: true,
  candidateMergeAuthorized: false,
  productionDeploymentAuthorized: false,
}, null, 2))
