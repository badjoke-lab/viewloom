import { KICK_REVIEWED_CITY_RUNTIME_DATA } from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'

export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1'

/* Review staging is intentionally kept outside apps/web/functions. Production
 * runtime data flows one-way into staging so pending reviewed outcomes can be
 * appended without duplicating the already-consumed catalog. Production code
 * never imports this staging module.
 */
export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA = Object.freeze([
  ...KICK_REVIEWED_CITY_RUNTIME_DATA,
  { stableKickUserId: "120230138", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "17385774", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "94861327", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "105594971", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "31278642", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "55252709", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "62321809", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "100822777", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "42962282", outcome: "excluded_nonperson", claimKind: null, placement: null },
  { stableKickUserId: "37936", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "120589113", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "59542519", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "222819", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
])
