# Production smoke runbook

The `Production Smoke` workflow verifies the deployed custom domain after a main deployment.

## Automatic triggers

- push to `main` when web or workflow files change;
- daily scheduled health check;
- manual workflow dispatch.

## Exact deployment matching

Cloudflare Pages provides `CF_PAGES_COMMIT_SHA`, `CF_PAGES_BRANCH`, and `CF_PAGES_URL` during the build. The web post-build step writes those values to `/deployment.json`. The smoke workflow waits until production reports the same SHA as the triggering main commit.

## Checks

- Portal and all Twitch/Kick feature routes return HTML;
- Twitch and Kick History titles are present;
- Google Analytics is present in the built Portal;
- Twitch status resolves `DB_TWITCH_HOT` to `vl_twitch_hot`;
- Kick status resolves `DB_KICK_HOT` to `vl_kick_hot`;
- both collectors report `ok` and non-stale freshness;
- unknown routes return the explicit ViewLoom 404 page;
- `/cloudflare-preview-probe.json` is absent from production.

## Failure handling

A failure does not redeploy or modify production. Inspect the uploaded `production-smoke-artifacts`, determine whether the problem is deployment lag, static routing, Pages Functions, D1 bindings, or collector freshness, then repair through a reviewed branch.
