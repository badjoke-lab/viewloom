import assert from 'node:assert/strict'
import {
  auditLocationCandidates,
  extractTagLocationCandidates,
  extractTitleLocationCandidates,
} from './location-candidate-extractor.mjs'

assert.deepEqual(extractTitleLocationCandidates('IRL live from Seoul').candidates, [
  {
    source: 'stream_title',
    kind: 'city',
    countryCode: 'KR',
    countryName: 'South Korea',
    city: 'Seoul',
    confidence: 'candidate_only',
  },
])

assert.equal(extractTitleLocationCandidates('Japan trip tomorrow').rejected, 'future_or_planned_travel_wording')
assert.equal(extractTitleLocationCandidates('Japan speedrun practice').candidates.length, 0)
assert.equal(extractTitleLocationCandidates('live in Tokyo').candidates.some((candidate) => candidate.city === 'Tokyo'), true)
assert.equal(extractTitleLocationCandidates('going to Berlin tomorrow').candidates.length, 0)

assert.equal(extractTagLocationCandidates(['Seoul']).some((candidate) => candidate.city === 'Seoul'), true)
assert.equal(extractTagLocationCandidates(['English']).length, 0)
assert.equal(extractTagLocationCandidates(['Just Chatting']).length, 0)

const audit = auditLocationCandidates([
  { title: 'live in Tokyo', tags: ['Tokyo'], language: 'ja' },
  { title: 'Japan trip tomorrow', tags: ['English'], language: 'en' },
  { title: 'regular stream', tags: ['Seoul'], language: 'ko' },
])

assert.equal(audit.languageUsedForPlacement, false)
assert.equal(audit.counts.anyCandidateStreams, 2)
assert.equal(audit.counts.titleCandidateStreams, 1)
assert.equal(audit.counts.tagCandidateStreams, 2)
assert.equal(audit.counts.titleAndTagCandidateStreams, 1)
assert.equal(audit.counts.rejectedFutureTravelTitles, 1)
assert.equal(audit.candidateCountries.JP, 1)
assert.equal(audit.candidateCountries.KR, 1)

console.log('location candidate extractor tests passed')
