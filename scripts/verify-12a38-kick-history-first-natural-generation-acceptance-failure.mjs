import fs from 'node:fs'

const evidencePath = 'docs/audits/12a38-kick-history-first-natural-generation-acceptance-failure.json'
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(evidence.schemaVersion === 'viewloom-12a38-kick-history-first-natural-generation-acceptance-failure-v1', 'schema')
assert(evidence.phase === '12A-38', 'phase')
assert(evidence.issue === 913, 'issue')
assert(evidence.provider === 'kick', 'provider')
assert(evidence.formalDetermination === 'FAIL', 'formal determination')
assert(evidence.reason === 'streamer_category_candidate_overflow_fail_closed', 'failure reason')
assert(evidence.sourceMainSha === '971b26ca4982253683a1781b37ee3df8536bcfe0', 'source main')

const prod = evidence.productionEnablement
assert(prod.startDay === '2026-08-17', 'start day')
assert(prod.generatorEnabled === true, 'generator enabled')
assert(prod.categoryRowCapPerDay === 300, 'category cap')
assert(prod.streamerCategoryRowCapPerDay === 1000, 'streamer category cap')
assert(prod.rowsReadMaximum === 250000, 'rows_read guard')
assert(prod.cron === '*/5 * * * *', 'cron')

const obs = evidence.observation
assert(obs.retrievalPr === 918 && obs.retrievalPrMerged === false, 'retrieval PR')
assert(obs.retrievalPrHead === 'b5421d3f876ddb597d486175dcc1076c0e8c64f5', 'retrieval head')
assert(obs.runId === 32206729876, 'run id')
assert(obs.contractJobId === 95931320130 && obs.contractJobResult === 'success', 'contract job')
assert(obs.observationJobId === 95931365965 && obs.observationJobResult === 'failure', 'observation job')
assert(obs.artifactId === 9349382835, 'artifact id')
assert(obs.artifactDigest === 'sha256:cf8ef86a3793d8cca028d2fafcddd0ea2c7dae4e549e45471af5d58a54309900', 'artifact digest')
assert(obs.readOnly === true, 'read only')
assert(obs.queryCost.rowsRead === 431, 'observation rows_read')
assert(obs.queryCost.rowsWritten === 0 && obs.queryCost.changes === 0, 'observation must not write')
assert(obs.queryCost.rowsReadMaximum === 250000 && obs.queryCost.rowsRead <= obs.queryCost.rowsReadMaximum, 'observation guard')

const byDay = Object.fromEntries(evidence.statusRows.map(row => [row.day, row]))
const d17 = byDay['2026-08-17']
const d18 = byDay['2026-08-18']
const d19 = byDay['2026-08-19']
assert(d17 && d18 && d19, 'expected status days')
assert(d17.candidateCategoryRows === 125 && d17.categoryRowCap === 300, 'Aug17 category count')
assert(d17.candidateStreamerCategoryRows === 1108 && d17.streamerCategoryRowCap === 1000, 'Aug17 streamer category overflow')
assert(d17.coverageState === 'unavailable_overflow', 'Aug17 fail close')
assert(d18.candidateCategoryRows === 136 && d18.categoryRowCap === 300, 'Aug18 category count')
assert(d18.candidateStreamerCategoryRows === 1066 && d18.streamerCategoryRowCap === 1000, 'Aug18 streamer category overflow')
assert(d18.coverageState === 'unavailable_overflow', 'Aug18 fail close')
assert(d17.missingCategoryItems === 0 && d18.missingCategoryItems === 0, 'no missing category items on failure days')
assert(d19.candidateCategoryRows === 24 && d19.candidateStreamerCategoryRows === 116 && d19.coverageState === 'partial', 'Aug19 partial state')

for (const value of Object.values(evidence.preactivationRows)) assert(value === 0, 'preactivation rows must remain zero')
for (const value of Object.values(evidence.providerLeakageRows)) assert(value === 0, 'provider leakage must remain zero')
assert(evidence.checks.requiredDaysPresent === true, 'required days present')
assert(evidence.checks.requiredDaysAuthoritative === false, 'required days must be non-authoritative')
assert(evidence.checks.capsRespected === false, 'caps result must be false')
assert(evidence.checks.noPreactivationRows === true, 'preactivation check')
assert(evidence.checks.noProviderLeakage === true, 'leakage check')
assert(evidence.checks.naturalWindowRefreshObserved === true, 'natural window evidence')
assert(evidence.checks.observationReadOnly === true, 'read only check')
assert(evidence.rootCause.categoryCapExceeded === false, 'category cap must not be root cause')
assert(evidence.rootCause.streamerCategoryCapExceeded === true, 'streamer category cap root cause')

for (const [key, value] of Object.entries(evidence.boundaries)) {
  assert(value === false, `boundary must remain false: ${key}`)
}
assert(evidence.nextGate === 'separate_bounded_streamer_category_overflow_remediation_decision', 'next gate')

const retiredPaths = [
  '.github/workflows/analytics-12a37-kick-history-first-natural-generation-observation.yml',
  'scripts/verify-12a37-kick-history-first-natural-generation-observation.mjs',
  'docs/audits/12a37-kick-history-first-natural-generation-observation-trigger.json',
]
for (const path of retiredPaths) assert(!fs.existsSync(path), `12A-37 execution surface still present: ${path}`)

const canonicalPass = JSON.parse(fs.readFileSync('docs/audits/12a26-kick-history-category-reprobe-production-pass.json', 'utf8'))
assert(canonicalPass.performanceDetermination === 'PASS', 'canonical cost pass status')
assert(canonicalPass.result?.cost?.rowsRead === 16117, 'canonical cost PASS must remain 16117')
assert(canonicalPass.thresholds?.rowsReadMaximum === 250000, 'canonical cost threshold')

console.log('12A-38 acceptance FAIL evidence and 12A-37 execution-surface retirement verified')
