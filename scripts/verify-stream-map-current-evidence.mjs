import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  CURRENT_ACCEPTED_EVIDENCE_CLASSES,
  CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES,
  CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS,
  CURRENT_STANDALONE_REJECTED_CLASSES,
  classifyCurrentEvidenceClass,
  evaluateCurrentLocationEvidence,
} from "../workers/collector-twitch/scripts/current-location-evidence-eligibility.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(
  repoRoot,
  "workers/collector-twitch/fixtures/current-location-evidence-contract-v0.1.json",
);

const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const auditPath = path.join(repoRoot, fixture.sourceAudit);
const audit = JSON.parse(await readFile(auditPath, "utf8"));
const auditPolicy = audit.reviewPolicy;
const fixturePolicy = fixture.policy;

assert.equal(
  audit.schemaVersion,
  "viewloom-twitch-stream-map-current-review-batch-v0.1",
  "unexpected Current review audit schema",
);
assert.equal(
  fixture.schemaVersion,
  "viewloom-twitch-current-location-evidence-contract-v0.1",
  "unexpected Current evidence fixture schema",
);

assert.deepEqual(
  fixturePolicy.acceptedEvidenceClasses,
  auditPolicy.acceptedEvidenceClasses,
  "fixture accepted evidence classes drifted from reviewed audit",
);
assert.deepEqual(
  fixturePolicy.candidateOnlyEvidenceClasses,
  auditPolicy.candidateOnlyEvidenceClasses,
  "fixture candidate-only evidence classes drifted from reviewed audit",
);
assert.deepEqual(
  fixturePolicy.standaloneRejectedClasses,
  auditPolicy.standaloneRejectedClasses,
  "fixture standalone-rejected evidence classes drifted from reviewed audit",
);
assert.equal(
  fixturePolicy.defaultOpenEndedTtlHours,
  auditPolicy.defaultOpenEndedTtlHours,
  "fixture Current TTL drifted from reviewed audit",
);
assert.equal(
  fixturePolicy.requiresAttributableTemporalEvidence,
  auditPolicy.requiresAttributableTemporalEvidence,
  "fixture temporal-attribution requirement drifted from reviewed audit",
);
assert.equal(
  fixturePolicy.autoAcceptanceAuthorized,
  auditPolicy.autoAcceptanceAuthorized,
  "fixture auto-acceptance authorization drifted from reviewed audit",
);
assert.equal(
  fixturePolicy.publicCurrentPlacementAuthorized,
  auditPolicy.publicCurrentPlacementAuthorized,
  "fixture public-placement authorization drifted from reviewed audit",
);

assert.deepEqual(
  CURRENT_ACCEPTED_EVIDENCE_CLASSES,
  auditPolicy.acceptedEvidenceClasses,
  "helper accepted evidence classes drifted from reviewed audit",
);
assert.deepEqual(
  CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES,
  auditPolicy.candidateOnlyEvidenceClasses,
  "helper candidate-only evidence classes drifted from reviewed audit",
);
assert.deepEqual(
  CURRENT_STANDALONE_REJECTED_CLASSES,
  auditPolicy.standaloneRejectedClasses,
  "helper standalone-rejected evidence classes drifted from reviewed audit",
);
assert.equal(
  CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS,
  auditPolicy.defaultOpenEndedTtlHours,
  "helper Current TTL drifted from reviewed audit",
);

assert.equal(CURRENT_ACCEPTED_EVIDENCE_CLASSES.length, 4);
assert.equal(CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES.length, 5);
assert.equal(CURRENT_STANDALONE_REJECTED_CLASSES.length, 11);
assert.equal(CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS, 24);
assert.equal(auditPolicy.autoAcceptanceAuthorized, false);
assert.equal(auditPolicy.publicCurrentPlacementAuthorized, false);

const allClasses = [
  ...CURRENT_ACCEPTED_EVIDENCE_CLASSES,
  ...CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES,
  ...CURRENT_STANDALONE_REJECTED_CLASSES,
];
assert.equal(
  new Set(allClasses).size,
  allClasses.length,
  "Current evidence class sets must remain disjoint",
);

for (const evidenceClass of CURRENT_ACCEPTED_EVIDENCE_CLASSES) {
  assert.equal(classifyCurrentEvidenceClass(evidenceClass), "accepted");
}
for (const evidenceClass of CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES) {
  assert.equal(classifyCurrentEvidenceClass(evidenceClass), "candidate_only");
}
for (const evidenceClass of CURRENT_STANDALONE_REJECTED_CLASSES) {
  assert.equal(classifyCurrentEvidenceClass(evidenceClass), "standalone_rejected");
}

for (const scenario of fixture.scenarios) {
  const actual = evaluateCurrentLocationEvidence(scenario.evidence, {
    evaluatedAt: scenario.evaluatedAt,
  });
  assert.equal(
    actual.eligible,
    scenario.expectedEligible,
    `${scenario.name}: eligibility mismatch`,
  );
  assert.equal(
    actual.reason,
    scenario.expectedReason,
    `${scenario.name}: reason mismatch`,
  );
  assert.equal(
    actual.effectiveExpiresAt,
    scenario.expectedEffectiveExpiresAt,
    `${scenario.name}: effective expiry mismatch`,
  );
}

console.log(
  `Current evidence contract verified: ${CURRENT_ACCEPTED_EVIDENCE_CLASSES.length} accepted / ${CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES.length} candidate-only / ${CURRENT_STANDALONE_REJECTED_CLASSES.length} standalone-rejected; ${fixture.scenarios.length} scenarios`,
);
