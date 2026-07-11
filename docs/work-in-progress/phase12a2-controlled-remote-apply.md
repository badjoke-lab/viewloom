# Phase 12A-2 controlled remote schema apply

Status: active implementation candidate
Branch: `work-analytics-12a2-immediate-schema-bootstrap`

## Purpose

Apply the accepted compact intraday schema through existing provider-specific collector D1 bindings without adding a public DDL route or a new cron, and without waiting for the next maintenance window after deployment.

## Design

```text
shared DDL source: workers/shared/intraday-schema.ts
Twitch entry: workers/collector-twitch/src/entry.ts
Kick entry: workers/collector-kick/src/entry.ts
existing collector cron: */5 * * * *
immediate startup attempt: max 1 per Worker isolate
maintenance windows: 00:20-00:24 and 12:20-12:24 UTC
maintenance retries/provider/day: max 2
warm-isolate schema presence cache: yes
```

Each provider wrapper:

```text
runs the existing collector scheduled handler
then, in finally, calls the shared bootstrap
on a new isolate, allows one immediate startup attempt
checks remote schema object count before DDL
skips DDL when all 3 objects exist
otherwise applies the exact accepted three DDL statements
caches known-present state within the warm isolate
suppresses repeated non-maintenance startup retries in the same isolate
allows bounded maintenance-window retries after startup failure
contains bootstrap failures in a result object
logs provider-specific bootstrap result
```

## Boundaries

```text
new cron no
public DDL endpoint no
backfill no
generation no
retention change no
category capture no
provider start-time field no
exact-session field no
cross-provider analytics no
```

Merge does not prove Worker deployment or remote schema application. After deployment, rerun the production read-only schema evidence workflow and require 3 / 3 matching objects for Twitch and Kick.
