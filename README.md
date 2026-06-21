# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data.

## Core roles

- Heatmap = Now
- Day Flow = Today / selected UTC day
- Battle Lines = Rivalry
- History = Trends across retained days

Twitch and Kick remain separated across routes, APIs, storage, rankings, exports, and coverage claims. ViewLoom does not publish combined provider totals.

## Current production state

ViewLoom Core v1 is deployed on Cloudflare Pages with:

- separate Twitch and Kick D1 bindings;
- provider-specific Pages Functions;
- fresh bounded collector data;
- production deployment identity and smoke checks;
- explicit not-found behavior;
- production Heatmap, Day Flow, Battle Lines, History, Channel, and Status routes.

## Current priority

History & Trends is functionally extensive but its information architecture and visual layout are not accepted as final public quality.

The next milestone is the History layout rebuild:

```text
Overview
Archives
Report & Export
```

Channel / Streamer v1 expansion follows only after History production acceptance.

## Documentation and execution

Before changing this repository, read the canonical documentation index:

- [`docs/README.md`](docs/README.md)
- [`docs/operations/development-and-deployment-policy.md`](docs/operations/development-and-deployment-policy.md)
- [`docs/product/current-roadmap.md`](docs/product/current-roadmap.md)
- [`docs/product/current-schedule.md`](docs/product/current-schedule.md)

Feature work must also read the affected permanent specification, implementation plan, and any active note under `docs/work-in-progress/`.

Implementation does not begin from chat memory, an old PR, or screenshots alone. Governing repository documents are updated first when scope or behavior changes.

## Development operations

- normal work uses `work-*` branches;
- `preview-*` is reserved for deliberate Cloudflare runtime validation;
- completed candidates run the full required CI/browser gates;
- merge status is not production status;
- production completion requires exact deployment identity and smoke verification;
- provider separation and honest bounded coverage are mandatory.

## Repository structure

- `docs/` — canonical product, implementation, operations, and temporary working documents
- `apps/web/` — public pages, shared UI, Pages Functions, and browser/contract checks
- `workers/` — provider collectors and retention operations
- `packages/` — shared contracts and helpers where applicable

## Immediate execution order

1. documentation reset and History baseline;
2. History view-state and shell contract;
3. History Overview rebuild;
4. History Archives rebuild;
5. History Report & Export consolidation;
6. visual/responsive pass and complete candidate QA;
7. Cloudflare Preview and production acceptance;
8. delete the temporary History working note after permanent docs are finalized;
9. Channel / Streamer v1 completion;
10. next-feature data-capability audit.
