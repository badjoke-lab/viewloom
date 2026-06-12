# Deep Link QA Contract

This page records the minimum deep-link contract for ViewLoom live feature pages.

## Scope

The first deep-link pass covers URL-backed page state for:

- Day Flow
- Battle Lines
- History

Status has no user-controlled view state in this pass, so it remains outside the writable deep-link scope.

Heatmap selected-stream deep links are deferred until selection state is audited separately.

## Required behavior

- Pages must read supported query parameters on initial load.
- Pages must normalize unsupported values back to safe defaults.
- UI controls must reflect the normalized URL-backed state.
- User changes must update the URL with `history.replaceState` without reloading the page.
- API requests must use the normalized state, not raw query strings.
- Invalid query values must never break rendering.

## Supported parameters

Day Flow:

- `metric=volume|share`
- `top=10|20|50`
- `bucket=5|10`

Battle Lines:

- `metric=viewers|indexed`

History:

- `period=7d|30d`
- `metric=viewer_minutes|peak_viewers`

## Defaults

- Day Flow defaults to `metric=volume`, `top=20`, `bucket=5`.
- Battle Lines defaults to `metric=viewers`.
- History defaults to `period=30d`, `metric=viewer_minutes`.

## Regression rule

A page must not pass raw URL parameters directly to the API. Every deep-link parameter must pass through a normalizer before it is used for UI state or network requests.
