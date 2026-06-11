# SEO / Metadata QA Contract

This page records the production SEO and social metadata contract for ViewLoom public pages.

## Scope

All public HTML pages must keep a complete metadata set:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `og:site_name`
- `og:type`
- `og:url`
- `og:title`
- `og:description`
- `og:image`
- `twitter:card`
- `twitter:image`
- `twitter:title`
- `twitter:description`

## Canonical rules

- Canonical URLs must use `https://vl.badjoke-lab.com`.
- Canonical URLs must match the public page path.
- Directory pages must keep trailing slashes.
- `og:url` must match the canonical URL.

## Content rules

- Titles and social titles must include `ViewLoom`.
- Descriptions must not be empty placeholder copy.
- Social image URLs must use `/og/viewloom.svg`.
- Twitter card must remain `summary_large_image`.

A future change that drops canonical URLs, breaks Open Graph/Twitter metadata, or points social URLs away from the public canonical path is a regression.
