# Cloudflare verification — 2026-06-21

## Scope

This record covers the manual Cloudflare Pages configuration review and the live Preview runtime verification performed before the production cutover.

## Cloudflare Pages project

```text
Project: viewloom
Repository: badjoke-lab/viewloom
Production branch: main
Automatic production deployment: enabled
Root directory: apps/web
Build command: pnpm build && node scripts/normalize-built-head.mjs
Build output directory: dist
Build system version: 3
Build watch paths: *
```

The current build-watch rule is intentionally recorded as broad. It is functional but not optimized; narrowing it is a later maintenance task.

## Preview branch control

```text
Preview mode: custom branches
Included branch pattern: preview-*
Other branches, including work-*, are not selected for Preview deployment.
```

## Pages Functions bindings

Production and Preview were manually checked with separate Twitch and Kick bindings:

```text
DB_TWITCH_HOT -> vl_twitch_hot
DB_KICK_HOT   -> vl_kick_hot
```

No combined provider database or total is used.

## Preview candidate

```text
Branch: preview-cloudflare-cutover-20260621
Base main SHA: e1bc6cd0b8e17e82c566e9ac40f17cba1c89fe29
Verified Preview commit: efff6fe4bb8f0a9d915965cd23507c68e0b9ef3d
Branch Preview URL: https://preview-cloudflare-cutover-2.viewloom.pages.dev
Cloudflare deployment result: successful
```

The Preview-only probe returned:

```text
schema: viewloom-cloudflare-preview-probe-v1
source_branch: preview-cloudflare-cutover-20260621
production: false
```

## Runtime verification

### Twitch

`/api/twitch-status` returned a structured ViewLoom status response using:

```text
binding: DB_TWITCH_HOT
database: vl_twitch_hot
sourceMode: real
collector state: ok
run cadence: 300 seconds
freshness: fresh
observed streams: 300
coverage: partial, bounded to the current top-300 observation window
```

The bounded coverage statement remains visible and no provider-wide claim is made.

### Kick

`/api/kick-status` returned a structured ViewLoom Kick status response using:

```text
binding: DB_KICK_HOT
database: vl_kick_hot
source mode: authenticated
coverage mode: official-livestreams
collector state: ok
freshness: fresh
configured observation limit: 100
```

The response explicitly preserves the bounded endpoint limitation and does not claim complete provider-wide coverage.

## Verified state

```text
Cloudflare Preview build: passed
Cloudflare Preview deployment: passed
Preview probe: passed
Pages Functions routing: passed
Twitch D1 binding: passed
Kick D1 binding: passed
Twitch collector freshness: passed
Kick collector freshness: passed
Production deployment: pending this record's merge to main
Production smoke checks: pending deployment completion
```

## Non-changes

This verification did not change:

- D1 schema or data;
- collector code or cron schedules;
- retention policy;
- provider separation;
- API response contracts;
- production domain configuration.
