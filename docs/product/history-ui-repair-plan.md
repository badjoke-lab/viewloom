# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.2
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Completed P9H3: PR #439
Completed P9H3 canonical closeout: PR #440
Current implementation branch: `work-history-ui-h4a-overview-balance`
Exact next branch after merge and explicit continuation: `work-history-ui-h4b-tasks`

P9H4 is now split. P9H4A repairs the Overview layout and visual hierarchy defects confirmed by production screenshots. P9H4B retains Archives and Report & Export.

Historical gate strings, not current state:

```text
Version: 2.1
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created

Version: 2.0
Current implementation branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview   active
P9H4 work-history-ui-h4-tasks      exact next after P9H3 merge and explicit continuation; not created

Version: 1.9
Current implementation branch: none
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created

Version: 1.8
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`
P9H2 work-history-ui-h2-chart      active

Version: 1.7
Current implementation branch: none
P9H2 work-history-ui-h2-chart      exact next; not created
```

## Completed P9H3

PR #439 repaired Overview order and compactness while preserving P9H1 metric behavior and P9H2 chart/day-inspection behavior.

Accepted results:

- desktop retains the complete Overview analysis;
- mobile defaults to Summary, coverage status, chart, and Selected day;
- comparison, calendar, rankings/changes, and detailed coverage use explicit secondary controls;
- only one secondary mobile analysis is open at a time;
- opening secondary analysis makes no additional History request;
- Twitch and Kick routes and outputs remain separate.

```text
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h3-overview-browser.mjs
scripts/verify-history-ui-h3-overview.mjs
.github/workflows/history-ui-h3-overview.yml
```

## Active P9H4A — Overview balance

### Defects

1. The desktop `Key changes` surface uses sticky positioning and can overlap later content while the page scrolls.
2. The desktop Calendar uses square cells and occupies disproportionate vertical space compared with the chart, comparison, ranking, and coverage sections.
3. The ranking table loses useful width to a persistent right column even when that column has little information.
4. Summary treats coverage as a fifth peer metric even though coverage is page state, producing an uneven card row.
5. Partial/unavailable comparison occupies too much space relative to its usable conclusion.
6. The mobile chart remains vertically tight, Selected day is longer than necessary, and More analysis labels do not explain their value.

### Implementation

- add a final P9H4A stylesheet and small behavior module after P9H3;
- set `Key changes` to normal flow at all desktop widths;
- keep a two-column ranking/insight pair only while the ranking table remains useful, then stack the insight card below;
- override desktop Calendar cells to bounded 56–72px rows with no square aspect ratio;
- keep mobile Calendar behavior and horizontal safety;
- reduce Summary to Total/Highest observed, Peak day, Top streamer, and Change vs previous;
- include coverage quality and observed/partial/missing counts in the existing coverage status band;
- render partial/unavailable comparison as a concise withheld explanation instead of empty metric tiles;
- raise mobile chart minimum height and compress Selected day metrics/actions;
- add descriptions and disclosure indicators to the four mobile More analysis controls;
- preserve P9H1/P9H2/P9H3 behavior and every provider/request/output contract.

### Permanent acceptance

The P9H4A browser gate must cover:

- Twitch desktop at 1440px;
- Kick desktop at 1280px;
- Twitch desktop/tablet at 1024px and 820px for stacking/overflow geometry;
- Kick touch mobile at 390px;
- Twitch touch mobile at 360px;
- no `sticky` or `fixed` computed position for `Key changes`;
- no geometric intersection between `Key changes` and detailed coverage;
- Calendar total/cell height bounds;
- ranking table width bounds and narrow-desktop stacking;
- four Summary cards plus visible coverage state/counts;
- mobile chart minimum height, three visible selected streamers, and one-open-at-a-time secondary analysis;
- no History refetch when secondary analysis is opened;
- provider separation and no page-level horizontal overflow.

## Remaining sequence

```text
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H5  work-history-ui-h5-responsive        queued
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

P9H4B covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

P9H4A is active. Do not create `work-history-ui-h4b-tasks` before P9H4A merges, canonical closeout is complete, and explicit continuation is received.