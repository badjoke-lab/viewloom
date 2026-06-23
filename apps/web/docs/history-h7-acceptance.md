# History H7 acceptance

Status: active
Base: 7912f8328ff6c163ef9e4296ebbdbcf8f9fde8d8
Branch: work-history-h7

H7 confirms the completed History candidate on the hosted preview and then on the public site.

## Preview

- Pages Functions are available.
- Twitch and Kick History use honest retained-data states.
- Provider routes stay separate.
- Overview, Archives, and Report and Export work on desktop and 390px mobile.
- Navigation, selected day, archive switching, exports, and links work.
- No page-level horizontal overflow.
- Keep Twitch desktop and Kick mobile screenshots.

## Public acceptance

- The deployed revision matches the accepted candidate.
- Twitch and Kick History pages load.
- Data source and state labels remain honest.
- Core task and archive smoke checks pass.
- Shared Status and Channel links still work.

## Documentation

After acceptance, move stable decisions into permanent docs, update the roadmap, remove the temporary rebuild note and its index link, and record the accepted revision and date.

H7 adds no new History feature, metric, provider mixing, collector change, migration, schedule, retention rule, or export format.
