# ViewLoom History visual and responsive H5 contract

Status: H5 implementation contract

H5 reconciles the completed Overview, Archives, and Report & Export task views into one readable and accessible History visual system. It does not change task order, data contracts, or output semantics.

## Cross-view hierarchy

- History remains bounded to a 1440px analysis workspace on wide screens.
- Major section spacing is visibly larger than spacing inside cards.
- Section titles use a consistent 20-24px scale.
- Surface headings and supporting copy wrap without clipping.
- Valid data surfaces remain dark and visually active.
- Overview chart remains more prominent than comparison and publishing tools.

## Readability

- Interactive controls are at least 13px on desktop and 14px on mobile.
- Auxiliary labels that previously rendered at 8-10px are normalized to at least 11px where H5 applies.
- Axis and explanatory copy remain readable at normal browser zoom.
- Long provider, streamer, category, and status text wraps safely.

## Focus and interaction

- Buttons, links, inputs, and tabindex-enabled cards receive a consistent visible focus ring.
- Active task, archive, and report-mode controls retain an accent indicator beyond text color.
- Mobile touch targets are at least 44px high; primary publishing actions are at least 48px high.
- Keyboard focus is not represented by color alone.

## State treatment

- Fresh/good, partial/stale/in-progress, missing/error, and demo badges include a non-color symbol.
- The current page exposes `data-history-visual-state` based on the visible History state pill.
- Attention, error, and demo coverage surfaces retain distinct border treatment without changing the underlying state value.
- H5 never converts missing, unavailable, partial, or withheld data into zero.

## Responsive behavior

- The page exposes `data-history-viewport=desktop|tablet|mobile` at 1180px and 760px breakpoints.
- Task and archive tabs remain horizontally reachable when space is constrained.
- Desktop, tablet, and 390px mobile views have no page-level horizontal overflow.
- The mobile chart may keep an intentional inner horizontal scroll area; it must not widen the document.
- Mobile actions stack into full-width touch targets where needed.

## Motion

- Under `prefers-reduced-motion: reduce`, History animation and transition durations are reduced to effectively zero.

## Verification matrix

- Twitch desktop Overview.
- Kick desktop Archives.
- Twitch tablet Report & Export.
- Kick mobile switching across Overview, Archives, and Report & Export.
- Provider endpoint isolation and no extra History request from task switching remain required.

## Non-goals

No History API, D1 schema, collector, cron, retention, metric, route, provider-combination, output-contract, Cloudflare binding, Preview, or production deployment change.
