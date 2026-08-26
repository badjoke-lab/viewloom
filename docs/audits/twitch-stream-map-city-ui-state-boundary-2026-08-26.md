# Twitch Stream Map City UI state boundary — 2026-08-26

- Country remains default.
- City is opt-in.
- Current / IRL is not exposed by this UI gate.
- Country and City never change accepted evidence records.
- City rendering must consume only the City API contract.
- Country-only and conflict rows are not silently promoted to City placement.
- Twitch login remains a non-stable join fallback because the minute snapshot does not expose stable Twitch user ID.
- No precise location fields are published.
- No production deploy, D1 mutation, schema change, or collector cadence change is part of this branch.
