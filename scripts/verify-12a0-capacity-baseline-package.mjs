#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const required = [
  '.github/workflows/analytics-12a0-capacity-baseline.yml',
  'docs/audits/12a0-capacity-baseline-contract.json',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
  'scripts/collect-12a0-capacity-baseline.mjs',
  'scripts/verify-12a0-capacity-baseline-contract.mjs',
  'scripts/verify-12a0-capacity-baseline-evidence.mjs',
]

for (const path of required) assert.equal(existsSync(path), true, `missing 12A-0 package file: ${path}`)

const collector = readFileSync('scripts/collect-12a0-capacity-baseline.mjs', 'utf8')
for (const fragment of [
  '/api/data-audit',
  '/api/twitch-status',
  '/api/kick-status',
  'read-only-production-observation',
  'bucket_completion_offset_seconds',
  'fetched_used_then_discarded',
  'No 12A-2 migration is authorized',
]) assert.ok(collector.includes(fragment), `collector missing contract fragment: ${fragment}`)

const workflow = readFileSync('.github/workflows/analytics-12a0-capacity-baseline.yml', 'utf8')
for (const fragment of [
  'VIEWLOOM_ORIGIN: https://vl.badjoke-lab.com',
  'collect-12a0-capacity-baseline.mjs',
  'verify-12a0-capacity-baseline-contract.mjs',
  'verify-12a0-capacity-baseline-evidence.mjs',
  'phase12a0-capacity-baseline',
]) assert.ok(workflow.includes(fragment), `workflow missing contract fragment: ${fragment}`)

const note = readFileSync('docs/work-in-progress/phase12a0-capacity-baseline.md', 'utf8')
for (const fragment of [
  'evidence-only',
  'does not change public runtime behavior',
  'measurementStatus = not_persisted',
  '12A-3 bounded intraday rollup generation',
  'D1 migration',
  'combined Twitch/Kick metrics',
]) assert.ok(note.includes(fragment), `working note missing boundary: ${fragment}`)

console.log('12A-0 capacity baseline package verification passed.')
