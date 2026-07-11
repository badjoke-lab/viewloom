# Phase 12A-2 collector Worker deployment

Status: active deployment implementation
Branch: `work-analytics-12a2-collector-worker-deploy`

## Purpose

Deploy the already-accepted controlled schema bootstrap code to the Twitch and Kick collector Workers through GitHub Actions using repository secrets.

## Required repository secrets

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Secret values must never be written to repository files, workflow summaries, artifacts, or logs.

## Workflow behavior

```text
pull request
  -> static deployment contract verification only
  -> collector typecheck and contract verification
  -> no Cloudflare deployment

main push affecting collector deploy paths
  -> verify
  -> deploy Twitch collector
  -> deploy Kick collector
  -> poll /api/schema-audit every 30 seconds
  -> require 3 / 3 matching objects for both providers

workflow_dispatch
  -> same production deployment and verification sequence
```

## Provider boundaries

```text
Twitch working directory workers/collector-twitch
Twitch Worker viewloom-collector-twitch
Twitch binding DB_TWITCH_HOT

Kick working directory workers/collector-kick
Kick Worker viewloom-collector-kick
Kick binding DB_KICK_HOT
```

## Safety boundaries

```text
pull_request_target no
contents write permission no
direct wrangler d1 execute no
Pages deploy no
public DDL endpoint no
backfill no
generation no
retention change no
new cron no
category capture no
cross-provider analytics no
```

Merge will trigger the deployment workflow because the workflow file itself is included in the main-push path filter. Repository merge alone still does not count as deployment evidence; the deploy run and resulting production schema evidence are authoritative.
