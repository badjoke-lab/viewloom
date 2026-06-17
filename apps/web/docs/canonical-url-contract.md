# ViewLoom Canonical URL Contract

## Production origin

`https://vl.badjoke-lab.com`

## Rules

- Every public page has one canonical link and one `og:url`.
- The two values must be identical.
- Public directory routes use a trailing slash.
- Canonical metadata never includes query parameters or a hash.
- Twitch pages remain under `/twitch/`.
- Kick pages remain under `/kick/`.
- Portal pages remain outside provider directories.
- A provider page must not point to the other provider.

## Shareable view state

A feature page may use query parameters for a selected date, metric, scope, battle, or time. These parameters describe the current analysis view; they do not create a separate canonical document.

Example deep link:

`/twitch/day-flow/?date=2026-06-18&metric=share`

Canonical page:

`https://vl.badjoke-lab.com/twitch/day-flow/`

Feature-specific parameter allowlists and stable ordering are added by the following deep-link work.

## Source of truth

`src/navigation/url-contract.ts` defines the production origin and public file, route, and provider mapping.

`verify-canonical-url-contract.mjs` checks every public HTML page and fails CI when metadata is missing, duplicated, inconsistent, or assigned to the wrong provider route.
