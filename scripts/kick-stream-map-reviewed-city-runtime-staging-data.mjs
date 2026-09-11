export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1'

// Generated from independently reviewed Kick City batches through 2026-09-11.
// Review staging is intentionally kept outside apps/web/functions so newly
// reviewed terminal outcomes cannot affect production Kick Map runtime until a
// separate runtime-consumption change is reviewed.
// Only provider-stable identity, terminal City outcome, accepted Base City
// claim kind and accepted City placement are retained.
export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA = Object.freeze([
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
  {
    stableKickUserId: '5508767',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '35467',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '68312242',
    outcome: 'excluded_nonperson',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '31377709',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
  {
    stableKickUserId: '68422390',
    outcome: 'no_qualifying_evidence',
    claimKind: null,
    placement: null,
  },
])
