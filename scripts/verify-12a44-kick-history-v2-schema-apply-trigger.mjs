#!/usr/bin/env node
import fs from 'node:fs'

const triggerPath = process.argv[2] || 'docs/audits/12a43-kick-history-v2-schema-apply-trigger.json'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(fs.existsSync(triggerPath), `trigger file missing: ${triggerPath}`)
const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))

assert(trigger.schemaVersion === 'viewloom-12a44-kick-history-v2-schema-apply-trigger-v1', 'trigger schema mismatch')
assert(trigger.status === 'armed_for_one_time_main_push', 'trigger status mismatch')
assert(trigger.provider === 'kick', 'provider mismatch')
assert(trigger.oneTime === true, 'oneTime must be true')
assert(trigger.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(trigger.acceptedCandidatePr === 927, 'accepted candidate PR mismatch')
assert(trigger.acceptedCandidateMergeSha === '102f3ce25d1bc277cc380ff8350a54c55bc0b17a', 'accepted candidate merge mismatch')
assert(trigger.packagePr === 929, 'package PR mismatch')
assert(trigger.expectedPackageHeadSha === 'b2574e0cf9494f79c5c84448a7aeb77298c40458', 'package head mismatch')
assert(trigger.expectedPackageMergeSha === 'd75d05ca4855390c36d18d9c55237fb4c651f5b1', 'package merge mismatch')
assert(typeof trigger.sourceMainSha === 'string' && /^[0-9a-f]{40}$/.test(trigger.sourceMainSha), 'sourceMainSha must be a full SHA')

const expectedBoundaries = {
  v2GeneratorWiring: false,
  v1GeneratorDisablement: false,
  collectorChange: false,
  productionCollectorDeployment: false,
  manualGeneration: false,
  backfill: false,
  cronChange: false,
  rawRetentionChange: false,
  historyCategoryApiUiCutover: false,
  twitchRollout: false,
  crossProviderChange: false,
  newProductionCostProbe: false,
  thresholdRelaxation: false,
}
for (const [key, value] of Object.entries(expectedBoundaries)) {
  assert(trigger.boundaries?.[key] === value, `trigger boundary mismatch: ${key}`)
}

assert(trigger.authorizations?.productionSchemaExecution === true, 'production schema execution must be explicit in trigger')
assert(trigger.authorizations?.productionD1Mutation === true, 'production D1 mutation must be explicit in trigger')
for (const key of Object.keys(expectedBoundaries)) {
  assert(trigger.authorizations?.[key] === false, `trigger authorization must remain false: ${key}`)
}

console.log('12A-44 exact Kick History v2 schema apply trigger verified')
