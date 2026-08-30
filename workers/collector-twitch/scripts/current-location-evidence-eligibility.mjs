export const CURRENT_ACCEPTED_EVIDENCE_CLASSES = Object.freeze([
  "self_controlled_current_statement",
  "official_affiliated_current_statement",
  "attributable_editorial_current_statement",
  "reviewed_direct_self_statement_transcript",
]);

export const CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES = Object.freeze([
  "stream_title",
  "stream_tag",
  "profile_location_without_current_time_meaning",
  "search_snippet",
  "unrelated_social_repost",
]);

export const CURRENT_STANDALONE_REJECTED_CLASSES = Object.freeze([
  "nationality",
  "birthplace",
  "language",
  "timezone",
  "ip_inference",
  "name_cue",
  "organization_headquarters",
  "event_venue_without_presence",
  "planned_future_travel",
  "old_residence_statement",
  "category_or_game",
]);

export const CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS = 24;

const accepted = new Set(CURRENT_ACCEPTED_EVIDENCE_CLASSES);
const candidateOnly = new Set(CURRENT_CANDIDATE_ONLY_EVIDENCE_CLASSES);
const standaloneRejected = new Set(CURRENT_STANDALONE_REJECTED_CLASSES);

function parseTimestamp(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function classifyCurrentEvidenceClass(evidenceClass) {
  if (accepted.has(evidenceClass)) return "accepted";
  if (candidateOnly.has(evidenceClass)) return "candidate_only";
  if (standaloneRejected.has(evidenceClass)) return "standalone_rejected";
  return "unknown";
}

/**
 * Evaluates whether one reviewed evidence item is temporally eligible to support
 * Current Location. This helper does not authorize automatic acceptance or
 * public placement; those remain separately gated by review policy.
 */
export function evaluateCurrentLocationEvidence(
  evidence,
  { evaluatedAt = new Date().toISOString() } = {},
) {
  const evidenceClass = evidence?.evidenceClass ?? evidence?.sourceClass ?? null;
  const classDisposition = classifyCurrentEvidenceClass(evidenceClass);

  if (classDisposition !== "accepted") {
    return {
      eligible: false,
      classDisposition,
      reason:
        classDisposition === "candidate_only"
          ? "candidate_only_evidence_class"
          : classDisposition === "standalone_rejected"
            ? "standalone_rejected_evidence_class"
            : "unknown_evidence_class",
      effectiveExpiresAt: null,
    };
  }

  if (evidence?.attributableTemporalEvidence !== true) {
    return {
      eligible: false,
      classDisposition,
      reason: "missing_attributable_temporal_evidence",
      effectiveExpiresAt: null,
    };
  }

  const observedAtMs = parseTimestamp(evidence?.observedAt);
  const evaluatedAtMs = parseTimestamp(evaluatedAt);
  if (observedAtMs === null || evaluatedAtMs === null) {
    return {
      eligible: false,
      classDisposition,
      reason: "invalid_timestamp",
      effectiveExpiresAt: null,
    };
  }

  if (observedAtMs > evaluatedAtMs) {
    return {
      eligible: false,
      classDisposition,
      reason: "observation_is_in_future",
      effectiveExpiresAt: null,
    };
  }

  const explicitExpiresAtMs = parseTimestamp(evidence?.expiresAt);
  if (evidence?.expiresAt != null && explicitExpiresAtMs === null) {
    return {
      eligible: false,
      classDisposition,
      reason: "invalid_expiry_timestamp",
      effectiveExpiresAt: null,
    };
  }

  const effectiveExpiresAtMs =
    explicitExpiresAtMs ??
    observedAtMs + CURRENT_DEFAULT_OPEN_ENDED_TTL_HOURS * 60 * 60 * 1000;
  const effectiveExpiresAt = new Date(effectiveExpiresAtMs).toISOString();

  if (effectiveExpiresAtMs <= observedAtMs) {
    return {
      eligible: false,
      classDisposition,
      reason: "expiry_not_after_observation",
      effectiveExpiresAt,
    };
  }

  if (evaluatedAtMs >= effectiveExpiresAtMs) {
    return {
      eligible: false,
      classDisposition,
      reason: "expired_current_evidence",
      effectiveExpiresAt,
    };
  }

  return {
    eligible: true,
    classDisposition,
    reason: "qualifying_current_temporal_evidence",
    effectiveExpiresAt,
  };
}
