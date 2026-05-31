# ViewLoom SEO, GA4, and Google Search Console setup

Canonical production URL: `https://vl.badjoke-lab.com/`

This runbook covers the site-side SEO baseline for ViewLoom and the optional production setup for Google Analytics 4 (GA4) and Google Search Console (GSC). ViewLoom is an independent, unofficial observation tool; metadata should use `ViewLoom` as the product brand and `Twitch data` / `Kick data` as target-data labels.

## Canonical URL rules

- Use only `https://vl.badjoke-lab.com/` URLs in canonical tags, Open Graph URLs, and `sitemap.xml`.
- Keep trailing slashes for public HTML routes.
- Do not use legacy preview or retired project URLs as canonicals.
- Keep public provider wording unofficial and scoped to ViewLoom. Avoid wording that implies any official affiliation with Twitch or Kick.

## Current public sitemap URLs

The sitemap is served from `/sitemap.xml` and currently includes:

- `https://vl.badjoke-lab.com/`
- `https://vl.badjoke-lab.com/about/`
- `https://vl.badjoke-lab.com/support/`
- `https://vl.badjoke-lab.com/twitch/`
- `https://vl.badjoke-lab.com/twitch/heatmap/`
- `https://vl.badjoke-lab.com/twitch/day-flow/`
- `https://vl.badjoke-lab.com/twitch/battle-lines/`
- `https://vl.badjoke-lab.com/twitch/history/`
- `https://vl.badjoke-lab.com/twitch/status/`
- `https://vl.badjoke-lab.com/kick/`
- `https://vl.badjoke-lab.com/kick/heatmap/`
- `https://vl.badjoke-lab.com/kick/day-flow/`
- `https://vl.badjoke-lab.com/kick/battle-lines/`
- `https://vl.badjoke-lab.com/kick/history/`
- `https://vl.badjoke-lab.com/kick/status/`

If a future provider page becomes a placeholder or is not production-ready, remove it from `apps/web/public/sitemap.xml` or add a `noindex` policy until it is ready.

## GA4 setup

GA4 is optional and is controlled by the Vite environment variable `VITE_GA4_MEASUREMENT_ID`.

1. In Google Analytics, create or open the GA4 property for ViewLoom.
2. Create a Web data stream for `https://vl.badjoke-lab.com/`.
3. Copy the Measurement ID, which usually starts with `G-`.
4. Set `VITE_GA4_MEASUREMENT_ID` in the web app build environment.
5. Rebuild and deploy the site.
6. Open the deployed site and confirm the Google tag loads only when the env var is set.
7. Confirm normal `page_view` traffic in GA4 Realtime or DebugView.

Do not commit or hard-code a measurement ID. When `VITE_GA4_MEASUREMENT_ID` is missing, the Google tag loader does not run.

## GSC setup

GSC verification is optional and is controlled by the Vite environment variable `VITE_GSC_VERIFICATION_TOKEN`.

1. In Google Search Console, add a **URL-prefix property** for `https://vl.badjoke-lab.com/`.
2. Choose the HTML meta tag verification method.
3. Copy only the token from the `content="..."` value.
4. Set `VITE_GSC_VERIFICATION_TOKEN` in the web app build environment.
5. Rebuild and deploy the site.
6. View page source on `https://vl.badjoke-lab.com/` and confirm a meta tag like this appears only when the env var is set:
   ```html
   <meta name="google-site-verification" content="TOKEN_FROM_SEARCH_CONSOLE" />
   ```
7. Return to Search Console and click **Verify**.
8. Submit `https://vl.badjoke-lab.com/sitemap.xml` in Search Console.

Do not commit or hard-code the verification token. The token must come from the Search Console URL-prefix property for `https://vl.badjoke-lab.com/`.

## Deployment verification checklist

Run these checks after deploy:

```sh
curl -sS https://vl.badjoke-lab.com/ | grep -E 'rel="canonical"|og:url|twitter:card'
curl -sS https://vl.badjoke-lab.com/sitemap.xml
curl -sS https://vl.badjoke-lab.com/robots.txt
```

Confirm:

- `/sitemap.xml` contains only `https://vl.badjoke-lab.com/` URLs.
- `/robots.txt` includes `Sitemap: https://vl.badjoke-lab.com/sitemap.xml`.
- Each public page includes a title, meta description, canonical, `og:url`, `og:title`, `og:description`, and Twitter card tags.
- The GA4 loader is absent when `VITE_GA4_MEASUREMENT_ID` is missing and loads when the env var is set.
- The GSC verification meta tag is absent when `VITE_GSC_VERIFICATION_TOKEN` is missing and present when the env var is set.
