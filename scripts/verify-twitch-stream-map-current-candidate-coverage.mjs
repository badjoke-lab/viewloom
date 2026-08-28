import assert from 'node:assert/strict'
import fs from 'node:fs'
import { measureCurrentLocationCandidateCoverage } from '../tools/twitch-stream-map-current-location/candidate-coverage.mjs'

const fixturePath = 'docs/audits/twitch-stream-map-current-candidate-coverage-fixture-v0.1.json'
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
assert.equal(fixture.schemaVersion, 'viewloom-twitch-stream-map-current-candidate-input-v0.1')

const result = measureCurrentLocationCandidateCoverage(fixture.streams)
assert.equal(result.provider, 'twitch')
assert.equal(result.layer, 'current_candidate_measurement')
assert.equal(result.status, 'candidate_only')
assert.equal(result.population, fixture.expected.population)
assert.equal(result.candidateStreams, fixture.expected.candidateStreams)
assert.equal(result.candidateCoverage, fixture.expected.candidateCoverage)
assert.equal(result.counts.titleCandidateStreams, fixture.expected.titleCandidateStreams)
assert.equal(result.counts.tagCandidateStreams, fixture.expected.tagCandidateStreams)
assert.equal(result.counts.rejectedFutureTravelTitles, fixture.expected.rejectedFutureTravelTitles)
assert.equal(result.acceptanceAuthorized, fixture.expected.acceptanceAuthorized)
assert.equal(result.publicCurrentPlacementAuthorized, fixture.expected.publicCurrentPlacementAuthorized)
assert.equal(result.baseMutationAuthorized, fixture.expected.baseMutationAuthorized)
assert.equal(result.rawTextRetainedInResult, fixture.expected.rawTextRetainedInResult)
assert.equal(result.languageUsedForPlacement, false)
assert.equal(Object.prototype.hasOwnProperty.call(result, 'streams'), false)
assert.equal(JSON.stringify(result).includes('IRL live from Seoul'), false)

console.log(JSON.stringify(result, null, 2))
