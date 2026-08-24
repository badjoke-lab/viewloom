import fs from 'node:fs'
import { buildCoverageExpansionQueue } from '../tools/twitch-stream-map-coverage-expansion/queue.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const artifactPath = process.argv[2]
if (!artifactPath) throw new Error('usage: node scripts/build-twitch-stream-map-coverage-queue.mjs <top300-artifact.json>')

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const capturedAt = artifact.observedAt ?? artifact.capturedAt
const result = buildCoverageExpansionQueue({
  capturedAt,
  identities: artifact.identities,
  reviewedRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
})

const reconciled =
  result.counts.queued +
  result.counts.excludedFreshEvidence +
  result.counts.excludedNonPerson +
  result.counts.excludedStableHistory

if (reconciled !== result.counts.population) {
  throw new Error(`coverage_queue_reconciliation_failed:${reconciled}/${result.counts.population}`)
}

process.stdout.write(`${JSON.stringify({
  ...result,
  reconciliation: {
    queued: result.counts.queued,
    excludedFreshEvidence: result.counts.excludedFreshEvidence,
    excludedNonPerson: result.counts.excludedNonPerson,
    excludedStableHistory: result.counts.excludedStableHistory,
    population: result.counts.population,
    reconciled,
    passes: reconciled === result.counts.population,
  },
}, null, 2)}\n`)
