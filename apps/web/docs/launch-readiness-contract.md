# Launch Readiness Contract

This page records the final pre-launch checklist for the ViewLoom web surface.

## Public page inventory

The production web surface must keep these public pages:

- `/`
- `/about/`
- `/support/`
- `/twitch/`
- `/twitch/heatmap/`
- `/twitch/day-flow/`
- `/twitch/battle-lines/`
- `/twitch/history/`
- `/twitch/status/`
- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`
- `/kick/history/`
- `/kick/status/`

## Required QA gates

The launch surface must keep these verification scripts wired into `Web verification`:

- production source
- Heatmap QA
- Day Flow QA
- Battle Lines QA
- History QA
- Status QA
- Home QA
- Content QA
- SEO QA
- Mobile QA
- State QA
- Launch readiness QA

## Required artifacts

`Web verification` must upload one artifact named `web-verification-logs` containing every QA log, including `launch-readiness.log`.

## Launch posture

ViewLoom can proceed to public launch only when:

- the public page inventory is complete
- every live feature page is connected to a live entry script
- every QA contract has a matching verifier script
- the Web verification artifact contains all verifier logs
- public pages do not contain demo stream rows, static SVG fallback charts, or fake freshness values

This contract is intentionally boring. Its job is to prevent the final launch surface from silently losing one of the gates added during cleanup.
