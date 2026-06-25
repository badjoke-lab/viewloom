# TEMPORARY — ViewLoom Local Watchlist W5B production acceptance note

Status: active W5B acceptance
Created: 2026-06-25
Roadmap phase: Phase 6 — Local Watchlist v1 / W5B
Implementation branch: `work-watchlist-w5-production`
Accepted production candidate: `f3e0ee8741e96015c5440df167574b8002fccc0d`
Public origin: `https://vl.badjoke-lab.com`
Delete when: W5B evidence is transferred to the permanent production-acceptance record and the completion PR is ready to merge.

## Scope

- verify exact production `main` SHA through `/deployment.json`;
- verify Twitch and Kick bindings, collector health, and real data;
- verify provider Home secondary Watchlist entry points;
- verify Watchlist routes, metadata, local storage separation, provider-safe links, evidence, request counts, and responsive behavior;
- verify Twitch and Kick Channel saves with zero additional requests;
- create permanent acceptance evidence;
- close Phase 6 and remove all temporary Watchlist notes.

## Active acceptance files

```text
apps/web/scripts/watchlist-production-acceptance.mjs
.github/workflows/watchlist-production-acceptance.yml
```

## Pending evidence

```text
Production deployment identity: pending
Twitch production acceptance: pending
Kick production acceptance: pending
Home entry points: pending
Channel saves: pending
Responsive evidence: pending
Permanent record: pending
Temporary-note cleanup: pending
```
