import { KICK_REVIEWED_CITY_RUNTIME_DATA } from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'

export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1'

/* Review staging is intentionally kept outside apps/web/functions. Production
 * runtime data flows one-way into staging so pending reviewed outcomes can be
 * appended without duplicating the already-consumed catalog. Production code
 * never imports this staging module.
 */
export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA = Object.freeze([
  ...KICK_REVIEWED_CITY_RUNTIME_DATA,
  { stableKickUserId: "5680579", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "3989", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "26941417", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "85068550", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "64131", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "1303487", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "99529252", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "16792651", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "42854743", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "9534880", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "48346022", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "11569008", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "66620199", outcome: "excluded_nonperson", claimKind: null, placement: null },
  { stableKickUserId: "92621089", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "6126042", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "26352984", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "112548360", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "111715731", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "45669044", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "121904130", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "77982950", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "30120833", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "55426656", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "111523965", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "26844824", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
])
