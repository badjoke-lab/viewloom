import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path = new URL('../docs/audits/twitch-stream-map-current-live-probe-2026-08-28.json', import.meta.url);
const audit = JSON.parse(await readFile(path, 'utf8'));

assert.equal(audit.schemaVersion, 'viewloom-twitch-stream-map-current-live-probe-audit-v0.1');
assert.equal(audit.provider, 'twitch');
assert.equal(audit.source.workflowRunId, 33144962164);
assert.equal(audit.source.artifactId, 9675399492);
assert.equal(audit.population.sampleSize, 300);
assert.equal(audit.population.stableIdentity, 'twitchUserId');
assert.equal(audit.population.stableIdentityUnique, true);
assert.equal(audit.measurement.candidateStreams, 11);
assert.equal(audit.measurement.counts.anyCandidateStreams, 11);
assert.equal(audit.measurement.counts.titleCandidateStreams, 2);
assert.equal(audit.measurement.counts.tagCandidateStreams, 9);
assert.equal(audit.measurement.counts.rejectedFutureTravelTitles, 5);
assert.equal(audit.measurement.counts.cityCandidateStreams, 1);
assert.equal(audit.requests.token, 1);
assert.equal(audit.requests.streams, 3);
assert.equal(audit.requests.users, 0);

for (const key of [
  'acceptanceAuthorized',
  'publicCurrentPlacementAuthorized',
  'baseMutationAuthorized',
  'languageUsedForPlacement',
  'productionDeployment',
  'canonicalMutationApplied',
  'rawTitleStored',
  'rawTagsStored',
  'rawLanguageStored',
  'rawTextArtifactAllowed'
]) {
  assert.equal(audit.safetyBoundary[key], false, `${key} must remain false`);
}
assert.equal(audit.safetyBoundary.d1Writes, 0);
assert.equal(audit.safetyBoundary.status, 'candidate_only');
assert.equal(audit.conclusion.liveCandidateCoverageMeasured, true);
assert.equal(audit.conclusion.publicCurrentActivationReady, false);

const serialized = JSON.stringify(audit);
for (const forbidden of ['titleText', 'tagText', 'rawTitle', 'rawTags', 'rawLanguage']) {
  assert.equal(serialized.includes(`\"${forbidden}\"`), false, `audit must not contain raw field ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  sampleSize: audit.population.sampleSize,
  candidateStreams: audit.measurement.candidateStreams,
  candidateCoverage: audit.measurement.candidateCoverage,
  titleCandidates: audit.measurement.counts.titleCandidateStreams,
  tagCandidates: audit.measurement.counts.tagCandidateStreams,
  futureTravelRejected: audit.measurement.counts.rejectedFutureTravelTitles,
  cityCandidates: audit.measurement.counts.cityCandidateStreams,
  publicCurrentActivationReady: audit.conclusion.publicCurrentActivationReady,
  productionMutationAuthorized: false
}, null, 2));
