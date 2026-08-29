#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildUnmappedReasonView,
  unmappedReasonMeta,
} from '../src/features/twitch-stream-map/unmapped-reason-core.mjs'

const baseline = buildUnmappedReasonView({
  reasonCounts: {
    no_reviewed_evidence: 2,
    context_only_or_unaccepted_evidence: 1,
    excluded_nonperson: 1,
    conflicting_accepted_evidence: 1,
  },
  baselineUnmappedStreams: 5,
  baselineMappedStreams: 3,
  filteredMappedStreams: 3,
})

assert.equal(baseline.baselineReasonTotal, 5)
assert.equal(baseline.baselineUnmappedStreams, 5)
assert.equal(baseline.baselineReconciles, true)
assert.equal(baseline.filteredOutAcceptedStreams, 0)
assert.equal(baseline.currentViewUnmappedStreams, 5)
assert.equal(baseline.currentViewReasonTotal, 5)
assert.equal(baseline.currentViewReconciles, true)
assert.equal(baseline.currentReasons.some((row) => row.code === 'filtered_out_accepted_evidence'), false)

const filtered = buildUnmappedReasonView({
  reasonCounts: {
    no_reviewed_evidence: 2,
    context_only_or_unaccepted_evidence: 1,
    excluded_nonperson: 1,
    conflicting_accepted_evidence: 1,
  },
  baselineUnmappedStreams: 5,
  baselineMappedStreams: 3,
  filteredMappedStreams: 1,
})

assert.equal(filtered.baselineReasonTotal, 5)
assert.equal(filtered.baselineReconciles, true)
assert.equal(filtered.filteredOutAcceptedStreams, 2)
assert.equal(filtered.currentViewUnmappedStreams, 7)
assert.equal(filtered.currentViewReasonTotal, 7)
assert.equal(filtered.currentViewReconciles, true)
const derived = filtered.currentReasons.find((row) => row.code === 'filtered_out_accepted_evidence')
assert.equal(derived?.count, 2)
assert.equal(derived?.derived, true)

const mismatch = buildUnmappedReasonView({
  reasonCounts: { no_reviewed_evidence: 2 },
  baselineUnmappedStreams: 3,
  baselineMappedStreams: 1,
  filteredMappedStreams: 1,
})
assert.equal(mismatch.baselineReconciles, false)
assert.equal(mismatch.currentViewReconciles, false)

const empty = buildUnmappedReasonView({
  reasonCounts: {},
  baselineUnmappedStreams: 0,
  baselineMappedStreams: 0,
  filteredMappedStreams: 0,
})
assert.deepEqual(empty.currentReasons, [])
assert.equal(empty.currentViewReconciles, true)

assert.equal(unmappedReasonMeta('context_only_or_unaccepted_evidence').label, 'Context-only or unaccepted evidence')
assert.match(unmappedReasonMeta('context_only_or_unaccepted_evidence').detail, /Candidate-only evidence remains here/)
assert.equal(unmappedReasonMeta('conflicting_accepted_evidence').label, 'Conflicting accepted country evidence')
assert.equal(unmappedReasonMeta('excluded_nonperson').label, 'Excluded non-person channel')
assert.equal(unmappedReasonMeta('brand_new_reason').code, 'brand_new_reason')
assert.equal(unmappedReasonMeta('brand_new_reason').label, 'Brand New Reason')

const page = readFileSync('twitch/map/index.html', 'utf8')
const entry = readFileSync('src/features/twitch-stream-map/stream-map-entry-core.ts', 'utf8')
const view = readFileSync('src/features/twitch-stream-map/unmapped-reason-view.ts', 'utf8')
const css = readFileSync('src/features/twitch-stream-map/stream-map.css', 'utf8')
const apiCore = readFileSync('functions/api/twitch-stream-map-core.mjs', 'utf8')

assert.ok(page.includes('id="stream-map-unmapped-heading"'))
assert.ok(page.includes('id="stream-map-unmapped-current"'))
assert.ok(page.includes('id="stream-map-unmapped-baseline"'))
assert.ok(page.includes('id="stream-map-unmapped-filtered-out"'))
assert.ok(page.includes('id="stream-map-unmapped-reason-list"'))
assert.ok(page.includes('id="stream-map-excluded-nonperson-list"'))
assert.ok(page.includes('<code>filtered_out_accepted_evidence</code>'))
assert.ok(page.includes('Country drilldown does not alter these totals.'))

assert.ok(entry.includes("import { renderUnmappedReasonAnalysis } from './unmapped-reason-view'"))
assert.ok(entry.includes('filteredMappedStreams: summary.mappedStreams'))
assert.ok(entry.includes('coverage: payload.coverage'))
assert.ok(entry.includes('excludedNonPersonStreams: payload.excludedNonPersonStreams'))
assert.ok(view.includes("row.dataset.reasonSource = 'api'"))
assert.ok(view.includes("row.dataset.reasonSource = 'client_filter'"))
assert.ok(view.includes('model.baselineReconciles && model.currentViewReconciles'))
assert.ok(css.includes('.stream-map-unmapped-reason-row[data-reason-source="client_filter"]'))
assert.ok(css.includes('.stream-map-excluded-row'))

assert.ok(apiCore.includes("increment(unmappedReasonCounts, 'no_reviewed_evidence')"))
assert.ok(apiCore.includes("increment(unmappedReasonCounts, 'excluded_nonperson')"))
assert.ok(apiCore.includes("'context_only_or_unaccepted_evidence'"))
assert.ok(apiCore.includes("'conflicting_accepted_evidence'"))
assert.equal(apiCore.includes("increment(unmappedReasonCounts, 'filtered_out_accepted_evidence')"), false)
assert.equal(entry.includes('languageUsedForPlacement = true'), false)

console.log(JSON.stringify({
  ok: true,
  apiReasonCodesPreserved: true,
  baselineReconciliation: true,
  filteredAcceptedAdjustmentSeparated: true,
  currentViewReconciliation: true,
  zeroState: true,
  excludedNonPersonVisible: true,
  countryDrilldownDoesNotAlterReasonAccounting: true,
}, null, 2))
