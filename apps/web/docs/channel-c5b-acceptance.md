# Channel v1 C5B hosted acceptance

Status: active temporary acceptance note
Base main SHA: `27fdfba6f5a451d15dd86f5cc5918db2a3c7c598`
Work branch: `work-channel-c5b-hosted`
Preview branch: `preview-channel-v1`
Preview URL: `https://preview-channel-v1.viewloom.pages.dev`

## Scope

This milestone accepts the completed Channel / Streamer v1 implementation in Cloudflare Preview and then production. It does not change History UI, Channel feature semantics, APIs, D1 schemas, collectors, cron schedules, retention, provider separation, or export schemas.

## Preview acceptance

- The configured Cloudflare Pages Preview publishes the candidate marker.
- Pages Functions execute with Preview Twitch and Kick D1 bindings.
- `/api/history` returns `platform=twitch`, `source=real`, and retained data.
- `/api/kick-history` returns `platform=kick`, `source=real`, and retained data.
- One retained channel is selected independently from each provider payload.
- Twitch desktop and Kick 390px Channel pages load the accepted dark candidate.
- Overview, Retained Days, and Report & Export work from one provider History request.
- Retained Days starts at no more than six visible cards and Show all does not refetch.
- Report mode switching, copy, CSV, and JSON do not refetch.
- CSV and JSON filenames remain provider-specific.
- No page-level horizontal overflow exists.
- Hosted screenshots and a machine-readable evidence summary are retained as artifacts.

## Production acceptance

After this PR is merged:

- `/deployment.json` must report `environment=production`, `branch=main`, and the exact merged main SHA.
- Public Twitch and Kick History APIs must return real retained data.
- Public Twitch desktop and Kick 390px Channel acceptance must pass with real channels.
- A permanent Channel production acceptance record must be added.

## Closure

After production acceptance, a separate cleanup PR will:

- mark the permanent Channel specification accepted;
- mark the Channel implementation plan completed;
- update current roadmap and schedule;
- add the accepted main SHA and workflow runs;
- remove this temporary note, marker, hosted script, milestone workflow, and temporary Channel audit note.

History appearance work remains pending and is explicitly outside this milestone.
