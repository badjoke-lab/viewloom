# ViewLoom Channel / Streamer v1 production acceptance

Status: completed permanent record
Accepted on: 2026-06-23
Roadmap phase: Phase 3 — Channel / Streamer v1
Closure PR: #408

## Accepted production revision

```text
branch: main
commit_sha: efc14295f0a372b96afac740d6a01571f7582210
environment: production
deployment generated_at: 2026-06-23T12:48:40.659Z
Cloudflare Pages revision: https://03c84e1f.viewloom.pages.dev
public origin: https://vl.badjoke-lab.com
```

The exact revision was confirmed through `/deployment.json` before public browser acceptance began.

## Preview acceptance

```text
Preview branch: preview-channel-v1
Preview candidate SHA: 7feff50bb7233f029e775f764af03bf0c683e941
Workflow: Channel C5B Hosted Preview
Run id: 28027105615
Artifact: channel-c5b-hosted-artifacts
Artifact id: 7821161692
```

Preview Pages Functions used the configured Preview Twitch and Kick D1 bindings. Both provider History APIs returned `source=real`, `state=partial`, and 30 observed days.

Verified channels:

| Provider | Channel | Viewport | Retained days | Initial visible days | History requests |
|---|---|---:|---:|---:|---:|
| Twitch | Jynxzi | 1440×1100 | 26 | 6 | 1 |
| Kick | absi | 390×844 | 17 | 6 | 1 |

## Production acceptance

```text
Workflow: Channel C5B Production Acceptance
Run id: 28028685856
Artifact: channel-c5b-production-artifacts
Artifact id: 7821826483
Artifact digest: sha256:12ea1635f24744f849899fa01b6674882a706a6becba713b85b4cb2609b6acec
```

The production gate verified:

- `/deployment.json` reported `environment=production`;
- `/deployment.json` reported `branch=main`;
- `/deployment.json` reported the exact accepted SHA;
- `/api/history` returned real retained Twitch data;
- `/api/kick-history` returned real retained Kick data;
- Twitch and Kick channels were selected independently from provider-specific payloads;
- Overview loaded without an extra Channel-specific API;
- Retained Days started with no more than six visible cards;
- Show all and Show recent reused the loaded payload;
- Report & Export reused the loaded payload;
- Full summary and Short post remained provider-specific;
- copy output matched the selected report mode;
- CSV and JSON filenames included the provider, channel, and period;
- CSV preserved blank missing numeric values;
- JSON preserved `null` missing values and the provider identity;
- each accepted page made one provider History request;
- the Kick 390px report actions met the mobile touch-size contract;
- neither accepted page produced page-level horizontal overflow.

Production evidence:

| Provider | Channel | Source/state | Observed scope | Retained days | Initial visible | Request count |
|---|---|---|---:|---:|---:|---:|
| Twitch | Jynxzi | real / partial | 30 / 30 days | 26 | 6 | 1 |
| Kick | absi | real / partial | 30 / 30 days | 17 | 6 | 1 |

Accepted export names:

```text
viewloom-twitch-channel-jynxzi-30d.csv
viewloom-twitch-channel-jynxzi-30d.json
viewloom-kick-channel-absi-30d.csv
viewloom-kick-channel-absi-30d.json
```

## Visual evidence

The production artifact contains:

```text
twitch-channel-desktop.png
kick-channel-mobile.png
evidence.json
channel-c5b-deployment.json
```

Manual review confirmed:

- accepted ViewLoom dark hierarchy;
- disciplined Twitch purple and Kick green accents;
- readable provider/source/scope evidence near the top;
- usable Report & Export layout at desktop and 390px;
- long report text wrapping without page overflow;
- visible keyboard focus on the accepted report actions;
- Scope & Limits remained visible and explicit.

## Regression result

The Channel, History, Status, naming, policy, build, and web verification matrix completed successfully on the accepted candidate. One History Battle Browser attempt hit its known keyboard wait timeout; the failed job was rerun on the identical head and passed without a code change.

## Accepted product boundary

Channel / Streamer v1 remains a provider-specific retained daily Top 10 footprint. It does not claim:

- exact session starts or ends;
- uninterrupted duration;
- complete provider-wide rank or totals;
- offline status from absence;
- cross-platform identity or totals;
- category or language history.

No Channel-specific API, D1 migration, collector change, cron change, retention change, or cross-provider data path was introduced.

## Closure

PR #408 transfers stable C0–C5B evidence into permanent documentation and removes the temporary Channel audit note, hosted acceptance note, candidate marker, hosted browser script, Preview workflow, and production workflow.

History UI appearance work is pending separate screenshots and instructions. This acceptance does not change History runtime behavior or appearance.
