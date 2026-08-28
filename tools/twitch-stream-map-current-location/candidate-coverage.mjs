import { auditLocationCandidates } from '../../workers/collector-twitch/scripts/location-candidate-extractor.mjs'

export function measureCurrentLocationCandidateCoverage(streams) {
  const rows = Array.isArray(streams) ? streams : []
  const audit = auditLocationCandidates(rows)
  const population = rows.length
  const candidateStreams = audit.counts.anyCandidateStreams
  return {
    schemaVersion: 'viewloom-twitch-stream-map-current-candidate-coverage-v0.1',
    provider: 'twitch',
    layer: 'current_candidate_measurement',
    status: 'candidate_only',
    acceptanceAuthorized: false,
    publicCurrentPlacementAuthorized: false,
    baseMutationAuthorized: false,
    rawTextRetainedInResult: false,
    population,
    candidateStreams,
    candidateCoverage: population === 0 ? 0 : candidateStreams / population,
    counts: audit.counts,
    sourceYield: audit.sourceYield,
    candidateCountries: audit.candidateCountries,
    languageUsedForPlacement: false,
  }
}
