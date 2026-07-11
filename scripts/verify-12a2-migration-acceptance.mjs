#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'docs/audits/12a2-migration-acceptance.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a2-migration-acceptance-v1')
assert.equal(evidence.workstream, '12A-2 compact intraday rollup design and migration')
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.schemaOnly, true)
assert.equal(evidence.backfillIncluded, false)
assert.equal(evidence.runtimeGenerationIncluded, false)
assert.equal(evidence.generationAuthorized, false)
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.migrationFile, 'db/d1/004_intraday_rollups.sql')
assert.equal(evidence.tables.streamerIntradayRollups, 'streamer_intraday_rollups')
assert.equal(evidence.tables.status, 'intraday_rollup_status')
assert.equal(evidence.indexes.streamerDay, 'idx_intraday_streamer_day')
assert.equal(evidence.nextWorkstream, '12A-3 generation gate and bounded intraday rollup generation')

console.log('Permanent 12A-2 migration acceptance verification passed.')
console.log('- schema-only migration accepted')
console.log('- backfill absent')
console.log('- runtime generation absent')
console.log('- generation remains unauthorized')
