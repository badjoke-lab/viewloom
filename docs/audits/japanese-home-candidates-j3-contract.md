# Japanese Home candidates — J3 contract

Status: implementation candidate  
Date: 2026-09-10  
Scope: `/ja/`, `/ja/twitch/`, `/ja/kick/`

## Release boundary

These three routes are testable Japanese candidates, not the public Japanese release.

Until J10 they must remain:

- `noindex,follow`;
- self-canonical;
- absent from `sitemap.xml`;
- absent from public reciprocal hreflang;
- absent from a public language switcher;
- limited to the three implemented Japanese paths.

Links from these candidates to features without a Japanese counterpart must resolve to the existing English feature route rather than create an unavailable `/ja/*` URL.

## Shared implementation boundary

Twitch and Kick Japanese provider homes reuse the existing provider Home runtime and provider-specific APIs.

No Japanese localization work in J3 authorizes or changes:

- collector behavior or cadence;
- D1 schema, writes, bindings, or retention;
- provider aggregation;
- geography evidence or Current/IRL semantics;
- raw provider data.

## Candidate inventory

The candidate build owns 30 HTML routes plus the explicit 404.

- indexable routes: 23
- noindex routes: 7
- sitemap routes: 23
- required browser viewports: 4
- current browser scenarios: 120

The three additional noindex routes are the J3 Japanese Home candidates.

## Verification ownership

The J3 contract is enforced by:

- `apps/web/scripts/verify-japanese-home-candidates.mjs`;
- `scripts/verify-public-surface-inventory.mjs`;
- `scripts/verify-public-current-browser-audit.mjs`;
- `scripts/verify-public-browser-audit-current.mjs`;
- `.github/workflows/web-verification.yml`;
- `.github/workflows/public-browser-audit.yml`;
- `.github/workflows/production-smoke-pr.yml`;
- `.github/workflows/production-smoke.yml`.

Public indexing and language switching remain a separate J10 cutover.
