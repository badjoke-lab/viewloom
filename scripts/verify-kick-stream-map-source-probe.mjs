import fs from 'node:fs'

const workerPath = 'tools/kick-stream-map-source-probe/worker.mjs'
const wranglerPath = 'tools/kick-stream-map-source-probe/wrangler.toml'
const contractPath = 'docs/audits/kick-stream-map-source-probe-contract-v0.1.json'
const triggerPath = 'docs/audits/kick-stream-map-source-probe-trigger.json'

const worker = fs.readFileSync(workerPath, 'utf8')
const wrangler = fs.readFileSync(wranglerPath, 'utf8')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const fail = (message) => { throw new Error(message) }

if (contract.schemaVersion !== 'viewloom-kick-stream-map-source-probe-contract-v0.1') fail('contract schema')
if (contract.issue !== 1033 || contract.provider !== 'kick' || contract.mode !== 'read_only_preview') fail('contract identity')
if (contract.endpoints?.livestreams !== '/public/v2/livestreams') fail('livestream endpoint contract')
if (contract.endpoints?.channels !== '/public/v1/channels') fail('channels endpoint contract')
if (contract.endpoints?.legacyPublicFallbackAllowed !== false) fail('legacy fallback contract')
if (contract.budgets?.tokenRequestsMax !== 1 || contract.budgets?.livestreamRequestsMax !== 1 || contract.budgets?.channelRequestsMax !== 10 || contract.budgets?.d1WritesMax !== 0) fail('budget contract')
if (contract.retention?.rawProfileText !== false || contract.retention?.rawTitleText !== false || contract.retention?.rawTagText !== false || contract.retention?.geographyConclusions !== false) fail('retention contract')
if (contract.mutation?.productionDeployment !== false || contract.mutation?.collectorCadenceChange !== false || contract.mutation?.d1SchemaChange !== false || contract.mutation?.automaticGeographyAcceptance !== false || contract.mutation?.twitchEvidenceCopy !== false) fail('mutation contract')
if (contract.execution?.automaticSchedule !== false || contract.execution?.workflowDispatch !== false || contract.execution?.oneFileMainTriggerRequired !== true) fail('execution contract')

for (const expected of [
  "const LIVESTREAM_LIMIT = 100",
  "const CHANNEL_LOOKUP_MAX = 10",
  "https://api.kick.com/public/v2/livestreams",
  "https://api.kick.com/public/v1/channels",
  "https://id.kick.com/oauth/token",
  "legacyPublicFallback: 0",
  "rawProfileTextStored: false",
  "rawTitleTextStored: false",
  "rawTagTextStored: false",
  "geographyStored: false",
  "twitchEvidenceCopied: false",
]) {
  if (!worker.includes(expected)) fail(`worker missing ${expected}`)
}
if (worker.includes('https://kick.com/api/v2/channels')) fail('legacy public fallback present')
if (/\bDB_KICK_HOT\b/.test(worker) || /\.prepare\s*\(/.test(worker)) fail('D1 path present')
if (!worker.includes('responseBytes = { token: tokenResult.bytes')) fail('token response bytes not measured')
if (!worker.includes('descriptionCandidateKeys')) fail('channel description shape audit missing')
if (!worker.includes('customTagsPresent')) fail('custom tags presence audit missing')
if (!worker.includes('stableIdentityCoverage')) fail('stable identity coverage audit missing')

if (!wrangler.includes('name = "viewloom-collector-kick"')) fail('preview worker name')
if (!wrangler.includes('keep_vars = true')) fail('keep vars required')
if (/\[triggers\]/.test(wrangler) || /crons\s*=/.test(wrangler)) fail('scheduled trigger present')
if (/\[\[d1_databases\]\]/.test(wrangler) || /DB_KICK_HOT/.test(wrangler)) fail('D1 binding present')

if (process.argv.includes('--require-trigger')) {
  if (!fs.existsSync(triggerPath)) fail('trigger missing')
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  if (trigger.schemaVersion !== 'viewloom-kick-stream-map-source-probe-trigger-v0.1') fail('trigger schema')
  if (trigger.oneTime !== true || trigger.rearm !== false) fail('trigger one-time boundary')
  if (!/^[0-9a-f]{40}$/.test(String(trigger.expectedProbePackageMergeSha ?? ''))) fail('trigger package sha')
  if (trigger.issue !== 1033) fail('trigger issue')
  if (trigger.productionDeployment !== false || trigger.d1Writes !== 0) fail('trigger mutation boundary')
  if (trigger.tokenRequestsMax !== 1 || trigger.livestreamRequestsMax !== 1 || trigger.channelRequestsMax !== 10) fail('trigger budgets')
}

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  livestreamsV2: true,
  channelLookupsMax: 10,
  legacyPublicFallback: false,
  rawTextRetention: false,
  d1Writes: 0,
  productionDeployment: false,
  automaticSchedule: false,
}, null, 2))
