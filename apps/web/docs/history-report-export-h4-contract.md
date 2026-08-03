# ViewLoom History Report & Export H4 contract

Status: H4 implementation contract

History Report & Export is one secondary task workspace. It must not present report text, native sharing, share-card generation, and retained-data export as separate equally weighted page sections.

## Required structure

- One top-level `Report & Export` surface.
- Full report and Short post remain a segmented text mode switch.
- One ordered action area: Copy, Share through device, Preview share card, Download PNG, Download CSV, Download JSON.
- The native Share action is inserted immediately after Copy when the report workspace exists and is hidden when the Web Share API is unavailable.
- Share-card preview is hidden by default and rendered only after explicit preview or PNG download action.
- CSV and JSON retain their existing structured output contracts.
- Status messages for text, PNG, and retained-data export remain visible without creating separate full-width cards.

## Data and truth rules

- All outputs reuse the current provider-specific History response.
- Switching text mode, native sharing, opening the share preview, copying, or downloading must not issue another History API request.
- Native sharing uses exactly the currently visible Full report or Short post text.
- Twitch and Kick routes, values, filenames, labels, and claims remain separate.
- Missing daily rows remain explicit missing rows; values are never inferred.
- Output continues to state that ViewLoom observations are not provider-wide totals.
- Share cards do not use Twitch or Kick logos.

## Existing output compatibility

- Full report text and Short post content remain unchanged.
- Short post remains at most 280 Unicode code points.
- PNG remains 1200 × 630 with the existing provider/date filename.
- CSV headers, daily row semantics, and spreadsheet-safety handling remain unchanged.
- JSON remains `viewloom-history-export-v1`.

## Responsive behavior

- Desktop actions form a compact unified action bar.
- Tablet actions use the existing three-column action layout.
- Mobile actions stack into full-width touch targets.
- Opening or closing the share preview does not create page-level horizontal overflow.

## Non-goals

No History API, D1 schema, collector, cron, retention, metric, provider-combination, Cloudflare binding, Preview, or production deployment change.
