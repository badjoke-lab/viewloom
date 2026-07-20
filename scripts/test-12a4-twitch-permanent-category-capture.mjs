import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  bindingState,
  parseLastJson,
  projectStorage,
} from './run-12a4-twitch-permanent-category-observer.mjs'

const MB = 1024 * 1024
const normal = fs.readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const permanent = fs.readFileSync('workers/collector-twitch/wrangler.category-permanent.toml', 'utf8')
const kick = fs.readFileSync('workers/collector-kick/wrangler.toml', 'utf8')
const entry = fs.readFileSync('workers/collector-twitch/src/entry.ts', 'utf8')
const implementation = fs.readFileSync('workers/collector-twitch/src/index-category.ts', 'utf8')
const category = fs.readFileSync('workers/shared/category-capture.ts', 'utf8')

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null

assert.equal(toml(normal, 'name'), 'viewloom-collector-twitch')
assert.equal(toml(permanent, 'name'), toml(normal, 'name'))
assert.equal(toml(permanent, 'main'), 'src/entry.ts')
assert.equal(toml(permanent, 'database_name'), toml(normal, 'database_name'))
assert.equal(toml(permanent, 'database_id'), toml(normal, 'database_id'))
assert.equal(cron(permanent), '*/5 * * * *')
assert.equal(cron(permanent), cron(normal))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(permanent), false)
assert.notEqual(toml(permanent, 'database_id'), toml(kick, 'database_id'))

for (const fragment of [
  "categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)",
  'maybeGenerateCategoryIntradayRollups',
]) assert.ok(entry.includes(fragment), `entry missing ${fragment}`)

for (const fragment of [
  'game_id?: string',
  'game_name?: string',
  'categoryProviderId: categoryProviderId || null',
  'categoryName: categoryName || null',
  'encodeCategorySnapshot(input.items, input.hasMore)',
  'writeCategoryDictionary(',
  'categoryContractVersion',
  'categoryIds',
  'categoryRefs',
]) assert.ok(implementation.includes(fragment), `implementation missing ${fragment}`)

for (const fragment of [
  "export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'ON CONFLICT(provider, category_id) DO UPDATE SET',
  'dictionary.set(id, name)',
  'categoryRefs.push(ref)',
]) assert.ok(category.includes(fragment), `category contract missing ${fragment}`)

const accepted = projectStorage(390 * MB, 3700 * MB)
assert.equal(accepted.projectedNinetyDaySizeMb, 438.32)
assert.equal(accepted.projectedProviderHeadroomMb, 11.68)
assert.equal(accepted.providerPass, true)
assert.equal(accepted.accountPass, true)
assert.equal(projectStorage(395 * MB, 3700 * MB).providerPass, false)
assert.equal(projectStorage(390 * MB, 4100 * MB).accountPass, false)

const absent = bindingState({ result: { bindings: [] } })
assert.equal(absent.permanentFlagPresent, false)
assert.equal(absent.obsoleteCanaryBindingsPresent, false)
const enabled = bindingState({ result: { bindings: [
  { type: 'plain_text', name: 'CATEGORY_CAPTURE_ENABLED', text: 'true' },
] } })
assert.equal(enabled.permanentFlagPresent, true)
assert.equal(enabled.permanentCaptureEnabled, true)
const obsolete = bindingState({ result: { bindings: [
  { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
] } })
assert.equal(obsolete.obsoleteCanaryBindingsPresent, true)

const noisy = `\u001b[90mwrangler prefix\u001b[0m\n[{"results":[{"provider_leakage_rows":0}]}]\nwarning`
assert.equal(parseLastJson(noisy)[0].results[0].provider_leakage_rows, 0)
assert.throws(() => parseLastJson('no json here'), /json_output_missing/)

console.log(JSON.stringify({
  ok: true,
  provider: 'twitch',
  permanentConfigMatchesNormalIdentity: true,
  fiveMinuteCronPreserved: true,
  categorySourceMappingPresent: true,
  dictionaryAndPayloadContractPresent: true,
  storageGatesVerified: true,
  bindingGatesVerified: true,
  noisyJsonParserVerified: true,
  kickChanged: false,
}, null, 2))
