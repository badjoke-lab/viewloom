export const KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-data-v0.1'

// Generated from the independently re-reviewed 2026-09-07 Kick City batch 01.
// This file is intentionally not connected to the production Kick Map route yet.
// Runtime staging retains only provider-stable identity, terminal City outcome,
// accepted Base City claim kind and accepted City placement. Slug, source URLs,
// research prose, Current/temporary claims and creator coordinates are omitted.
export const KICK_REVIEWED_CITY_RUNTIME_DATA = Object.freeze([
  {
    stableKickUserId: '27894320',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '37423182',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '11096104',
    outcome: 'accepted',
    claimKind: 'declared_location',
    placement: { state: 'mapped', countryCode: 'TR', region: null, city: 'İstanbul' },
  },
  {
    stableKickUserId: '190599',
    outcome: 'accepted',
    claimKind: 'declared_location',
    placement: { state: 'mapped', countryCode: 'PL', region: null, city: 'Wrocław' },
  },
  {
    stableKickUserId: '75943919',
    outcome: 'accepted',
    claimKind: 'declared_location',
    placement: { state: 'mapped', countryCode: 'BR', region: null, city: 'Rio de Janeiro' },
  },
  {
    stableKickUserId: '106756949',
    outcome: 'accepted',
    claimKind: 'declared_location',
    placement: { state: 'mapped', countryCode: 'IN', region: 'Punjab', city: 'Fazilka' },
  },
  {
    stableKickUserId: '106763992',
    outcome: 'accepted',
    claimKind: 'declared_location',
    placement: { state: 'mapped', countryCode: 'IN', region: null, city: 'Mumbai' },
  },
])
