# ViewLoom development policy addendum

Status: source of truth for documentation-first execution and current Cloudflare verification

This addendum supplements `development-and-deployment-policy.md` until the next policy consolidation.

## Documentation-first execution

Before starting implementation, read in order:

1. `docs/README.md`;
2. `docs/product/current-roadmap.md`;
3. `docs/product/current-schedule.md`;
4. the affected permanent specification;
5. the affected implementation plan;
6. any active note under `docs/work-in-progress/`.

Implementation must not begin from chat memory, screenshots, or an old PR alone. Update governing documents first when scope, order, behavior, or acceptance criteria changed.

Every implementation PR identifies:

```text
Roadmap phase:
Schedule window:
Permanent specification:
Implementation plan:
Active working note, if any:
```

At milestone completion, stable decisions move into permanent docs, roadmap and schedule are updated, and completed temporary notes are deleted and unlinked.

## Current Cloudflare verification

```text
Last verified: 2026-06-21
Production branch main: verified
Automatic production deployment: verified
Preview custom include preview-*: verified
work-* not selected for Preview: verified through exclusive preview-* inclusion
Root directory apps/web: verified
Build command pnpm build && node scripts/normalize-built-head.mjs: verified
Build output dist: verified
Production DB_TWITCH_HOT -> vl_twitch_hot: verified
Production DB_KICK_HOT -> vl_kick_hot: verified
Preview DB_TWITCH_HOT -> vl_twitch_hot: verified
Preview DB_KICK_HOT -> vl_kick_hot: verified
Production deployment identity and smoke: verified
Explicit production 404: verified
Build watch paths: reviewed; current rule is broad (*) and remains an optimization task
```

Detailed evidence is in `cloudflare-verification-2026-06-21.md`.

When this addendum and the main policy conflict about documentation order or Cloudflare verification state, this addendum reflects the later verified state and must be consolidated into the main policy during the next policy-only cleanup.
