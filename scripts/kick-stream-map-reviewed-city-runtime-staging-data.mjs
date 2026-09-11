import { KICK_REVIEWED_CITY_RUNTIME_DATA } from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'

export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1'

/* Review staging is intentionally kept outside apps/web/functions. Production
 * runtime data flows one-way into staging so pending reviewed outcomes can be
 * appended without duplicating the already-consumed catalog. Production code
 * never imports this staging module.
 */
export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA = Object.freeze([
  ...KICK_REVIEWED_CITY_RUNTIME_DATA,
  { stableKickUserId: "4955749", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "213851", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "107459563", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "106450641", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "106611012", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "1247988", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "37025", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "78554", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "4855473", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "26050326", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "30861951", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "28010", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "1172681", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "107126", outcome: "excluded_nonperson", claimKind: null, placement: null },
  { stableKickUserId: "3664534", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "1442", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "121888369", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "4905728", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "68796756", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "9745255", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "120287121", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "9631690", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "1624536", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "9985294", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
  { stableKickUserId: "16799", outcome: "no_qualifying_evidence", claimKind: null, placement: null },
])
