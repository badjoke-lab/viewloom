# ViewLoom Phase 8 P8B public browser audit

Status: complete on the PR #428 completion branch  
Audit date: 2026-06-26  
Branch: `work-public-browser-audit`  
Verified evidence head: `75bc7f22e015edfe004158746796081a3719219b`  
Verified workflow run: `28203107250`  
Artifact: `public-browser-audit-p8b` (`7892012367`)  
Artifact digest: `sha256:793d2c70f24d0a1056767d1c59056b2b2884b03c25177d70c65ab506d18a268b`  
Exact next branch after merge and explicit continuation: `work-history-ui-h0-baseline`

## 1. Scope executed

P8B executed the repository-owned public-surface matrix against production and deterministic local History fixtures.

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History state and interaction scenarios
```

The workflow stores full-page screenshots, a browser audit log, local preview log, and `viewloom-public-browser-audit-v1` evidence in the `public-browser-audit-p8b` GitHub Actions artifact. The verified artifact is 30,608,845 bytes and expires on 2026-09-23 unless GitHub retention changes.

## 2. Result

```text
P0  0
P1  3
P2  5
P3  0
```

No production outage, materially wrong provider path, provider crossing, or horizontal overflow was found in the required matrix.

The owned-route status matrix returned 200 for 80 normal route scenarios and the expected 404 for the four explicit not-found scenarios. Headless Chromium aborted Google Analytics collection requests; these are external telemetry requests and are not classified as ViewLoom route failures.

## 3. Verified contracts

The audit verified:

- all 21 owned surfaces at all four widths;
- no Twitch/Kick provider-crossing API request in the recorded matrix;
- no horizontal page overflow over the audit threshold;
- deterministic History real, partial, stale, empty, missing, demo, in-progress, error, and loading states;
- History chart caption and accessible name change when the metric changes;
- deterministic History charts expose numeric Y labels, date labels, and day controls;
- Overview / Archives / Report & Export and Daily / Peaks / Battles switch without refetching History data;
- Back returns from Report to the immediately preceding Archives state and Forward restores Report;
- five required release-policy routes are currently absent and return the owned 404 page.

## 4. P1 findings

### P8B-P1-HISTORY-METRIC-SYNCHRONIZATION

On both providers, switching from Viewer-minutes to Peak viewers changes the URL, selected control, chart caption, and chart accessible name. It does not change the period summary or selected-day facts. The page therefore exposes a partial metric switch rather than one coherent metric execution contract.

Next: `P9H0`, then `P9H1`.

### P8B-P1-HISTORY-KEYBOARD-ENTRY

On both production History routes at 1440, 820, 390, and 360 widths, the first Tab does not move focus from the document body into a visible actionable control. Existing History accessibility workflows did not reject this condition.

Next: `P9H0`, then `P9H5`.

### P8B-P1-HISTORY-TASK-HIERARCHY

Full-page production evidence shows that History still lacks one coherent task-first hierarchy. Desktop separates a large number of analytical blocks without a sufficiently strong primary sequence. Mobile stacks the desktop information architecture into a very long page, so selected-day inspection, ranking, comparison, calendar, changes, and coverage compete instead of forming a compact mobile task flow.

Next: `P9H0`, `P9H3`, and `P9H5`.

## 5. P2 findings

### Mobile target sizes

Visible controls across multiple routes are commonly 34–42px high, below the 44px audit target. This includes shared mobile navigation and several feature controls.

Next: Phase 10 shared UI consolidation.

### Watchlist missing from Public Readiness

`/twitch/watchlist/` and `/kick/watchlist/` exist and retain dedicated acceptance workflows, but the general Public Readiness configuration does not enumerate them.

Next: Phase 10 or a narrow maintenance PR after P9H0 entry.

### General Production Smoke route omissions

The general smoke route list omits About, Support, Changelog, Twitch/Kick Channel, and Twitch/Kick Watchlist.

Next: Phase 11 unified acceptance matrix.

### Release-policy routes absent

The following repository-owned routes do not exist:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

Next: Phase 12 release readiness. This does not interrupt P9H0 unless an external compliance requirement makes it urgent.

### Day Flow date control lacks an accessible name

The visible date input on Twitch and Kick Day Flow lacks an accessible name at all four required widths.

Next: Phase 10 or a narrow repair if it blocks P1 acceptance.

## 6. Evidence interpretation corrections

The first P8B run never reached browser execution because the development-policy verifier and roadmap used different fixed wording. That governance mismatch was repaired.

The next run completed the production matrix but the audit harness aborted while expecting two Back operations to skip several valid Archives history entries and return directly to Overview. Source inspection showed that every task tab intentionally pushes its own URL state. The final probe therefore tests the real browser contract: one Back restores the immediately preceding Archives state and one Forward restores Report. The incorrect timeout is not recorded as a product defect.

The completed Watchlist verifier also required exact text from the P8A handoff and treated any later schedule as invalid. The historical P8A handoff strings are now retained explicitly while the live schedule remains P8B, so completed Watchlist acceptance no longer blocks later phases.

## 7. Ordered Phase 9 queue

```text
P9H0 work-history-ui-h0-baseline
     exact reproduction, owner trace, and failing permanent gates

P9H1 work-history-ui-h1-metric
     full metric execution synchronization

P9H2 work-history-ui-h2-chart
     chart scale, units, ticks, selected-day interaction, and regression lock

P9H3 work-history-ui-h3-overview
     summary, selected-day, and Overview hierarchy

P9H4 work-history-ui-h4-tasks
     Archives and Report & Export task content while preserving verified navigation/no-refetch behavior

P9H5 work-history-ui-h5-responsive
     keyboard entry, responsive hierarchy, mobile density, and accessibility

P9H6 work-history-ui-h6-candidate
     complete local candidate and regression lock

P9H7 work-history-ui-h7-acceptance
     deliberate Preview and exact production acceptance
```

No non-History P0/P1 interrupt was found. The exact next branch remains `work-history-ui-h0-baseline`, but it must not be created until PR #428 is merged, the full merge report is issued, and explicit continuation is received.

## 8. Machine-readable record

The canonical defect details, exact reproduction data, owners, existing gates, missing assertions, evidence filenames, artifact identity, and ordered queue are in:

```text
docs/audits/public-browser-defects.json
```
