import fs from 'node:fs'

const contractPath = 'docs/audits/twitch-stream-map-country-review-batch-contract-v0.1.json'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const fail = (message) => { throw new Error(message) }

if (contract.schemaVersion !== 'viewloom-twitch-stream-map-country-review-batch-contract-v0.1') fail('contract schema')
if (contract.source?.workflowRunId !== 32704826743) fail('source run')
if (contract.source?.population !== 300 || contract.source?.queued !== 297) fail('source counts')
if (contract.gate?.batchSizeMax !== 25) fail('batch size max')
if (contract.gate?.externalLookupsPerIdentityMax !== 5) fail('lookup per identity max')
if (contract.gate?.externalLookupsPerBatchMax !== 100) fail('lookup per batch max')
if (contract.gate?.providerRequestsPerBatchMax !== 0) fail('provider request max')
if (contract.gate?.calendarWeekControlsExecution !== false) fail('calendar gate must be false')
if (contract.gate?.automaticSourceAcceptance !== false) fail('automatic acceptance must be false')
if (contract.gate?.canonicalMutationBeforeValidation !== false) fail('pre-validation mutation must be false')

const allowedOutcomes = new Set(['accepted','no_qualifying_evidence','excluded_nonperson','conflict_unmapped'])
if (!Array.isArray(contract.gate?.terminalOutcomes) || contract.gate.terminalOutcomes.length !== allowedOutcomes.size || !contract.gate.terminalOutcomes.every((value) => allowedOutcomes.has(value))) fail('terminal outcomes')

const parts = contract.parts.map((path) => JSON.parse(fs.readFileSync(path, 'utf8')))
if (parts.length !== 3) fail('part count')
const batches = []
for (const [index, part] of parts.entries()) {
  if (part.schemaVersion !== 'viewloom-twitch-stream-map-country-review-batch-part-v0.1') fail(`part schema ${index + 1}`)
  if (part.sourceRunId !== contract.source.workflowRunId) fail(`part run ${index + 1}`)
  if (part.part !== index + 1) fail(`part ordinal ${index + 1}`)
  batches.push(...part.batches)
}
if (batches.length !== contract.expectedBatchCount) fail('batch count')

const ids = new Set()
const ranks = new Set()
let total = 0
let lastRank = 0
for (const [index, batch] of batches.entries()) {
  const expectedId = String.fromCharCode(65 + index)
  if (batch.batchId !== expectedId || batch.ordinal !== index + 1) fail(`batch id ${index + 1}`)
  if (!Array.isArray(batch.identities) || batch.identityCount !== batch.identities.length || batch.identityCount < 1 || batch.identityCount > contract.gate.batchSizeMax) fail(`batch size ${batch.batchId}`)
  if (batch.startRank !== batch.identities[0].rank || batch.endRank !== batch.identities.at(-1).rank) fail(`rank bounds ${batch.batchId}`)
  for (const row of batch.identities) {
    if (!Number.isInteger(row.rank) || !row.twitchUserId || !row.login) fail(`row shape ${batch.batchId}`)
    if (ids.has(row.twitchUserId)) fail(`duplicate twitch id ${row.twitchUserId}`)
    if (ranks.has(row.rank)) fail(`duplicate rank ${row.rank}`)
    if (row.rank <= lastRank) fail(`non-deterministic rank order ${row.rank}`)
    ids.add(row.twitchUserId)
    ranks.add(row.rank)
    lastRank = row.rank
    total += 1
  }
}
if (total !== contract.expectedIdentityCount || ids.size !== contract.expectedIdentityCount) fail('identity reconciliation')
if (batches.at(-1).identityCount !== 22) fail('final batch size')

console.log(JSON.stringify({ok:true,sourceRunId:contract.source.workflowRunId,batches:batches.length,identities:total,firstBatch:batches[0].identityCount,lastBatch:batches.at(-1).identityCount,calendarWeekControlsExecution:false,canonicalMutationBeforeValidation:false}))
