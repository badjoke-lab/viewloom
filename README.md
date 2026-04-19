# ViewLoom

ViewLoom is the rebuild line for the streaming observatory previously developed as Livefield.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Compare

These three roles stay fixed across Twitch and Kick.

## Current direction

This repository is the main rebuild line.
The old `livefield` repository remains a reference, comparison, and data-rescue source, but new foundation work moves here.

## First priorities

1. Establish the new source-of-truth docs.
2. Rebuild the data/DB foundation for Paid and Free operation.
3. Rebuild Twitch first, then mirror the architecture for Kick.
4. Apply the new ViewLoom visual system on top of the rebuilt foundation.

## Planned top-level structure

- `docs/` source-of-truth specs and migration docs
- `apps/web/` site shell and page apps
- `workers/collector/` collection and retention pipeline
- `packages/` shared types, helpers, contracts

## Immediate rebuild order

1. Docs and operational rules
2. DB split and retention model
3. Portal + Twitch shell
4. Twitch Heatmap
5. Twitch Day Flow
6. Twitch Battle Lines
7. Kick mirror
8. UI polish and brand rollout
