# Phase 12 release acceptance — 2026-07-09

Status: complete
Phase: Phase 12 — English release readiness
R12C-2 implementation PR: #486
R12C-3 implementation PR: #487
Target production main SHA: `32c27a9a772cb62ff38f009c5fd1bb095ac27ad8`
Permanent monitoring owner: `.github/workflows/production-smoke.yml`

## Acceptance boundary

Phase 12 is complete because:

1. R12A legal/support public-surface work is complete;
2. R12B support-flow readiness is complete through R12B-2;
3. R12C-0 message inventory is complete;
4. R12C-1 English launch copy and FAQ package is complete;
5. R12C-2 production-surface launch/share asset package is complete;
6. R12C-3 candidate acceptance passed all candidate gates;
7. the R12C-3 merge is deployed as the exact production `main` SHA;
8. Production Smoke passed against that exact SHA;
9. an independent closeout probe located the exact Production Smoke run, downloaded its artifact, and re-verified deployment identity, 25 public route artifacts, provider separation, collector freshness, monitoring evidence, and explicit 404 evidence.

## Candidate acceptance

Substantive candidate evidence:

```text
Candidate head SHA: 52584565ae3ac4b10509df68c90692915f7fe475
Workflow run: 28992701959
Artifact id: 8188563767
Artifact digest: sha256:e81cdbce17fb5a97285d1dbddce768fea7b0332705ab0afa424619db656c90d6
Result: candidate_pass
```

Final latest-head dedicated verification:

```text
Final PR head SHA: 9f971a9a5f307c190d57f6a0ed0a8828a72262b8
Workflow run: 28992998420
Artifact id: 8188684969
Artifact digest: sha256:9eba77e561a2f2660d9a9a1ff9cfc610f9b1fe94f08127f4ca66c86b4b7870ce
Result: pass
```

Accepted candidate checks included:

```text
full web typecheck
production build
Content QA
SEO QA
public-surface inventory
current public-state handoff
Public Readiness
25 routes x 4 viewports = 100 browser scenarios
Support-to-Stripe flow
Refund/Disclosure consistency
provider separation
R12C-0/R12C-1/R12C-2 retained package verification
```

Candidate browser evidence:

```text
Routes: 25
Viewports: 4
Scenarios: 100
Violations: 0
Provider crossing scenarios: 0
Provider-neutral API request scenarios: 0
Overflow scenarios: 0
Focus failures: 0
Unlabeled control scenarios: 0
Legal mobile target failures: 0
```

## Exact production SHA acceptance

Production Smoke evidence:

```text
Workflow: Production Smoke
Workflow run: 28993206779
Artifact id: 8188712759
Artifact digest: sha256:da5eb4e090f13edd469845f7270744356207ae2d268a79b64d805b5c7f6cd88b
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Environment: production
Branch: main
Checked at: 2026-07-09T04:05:45Z
Result: pass
```

Production checks:

```text
Repository-owned public routes checked: 25
Provider status APIs checked: 2
Provider crossing failures: 0
Explicit 404 failures: 0
Providers separate: true
Blocking alerts: 0
Watch alerts: 2
```

## Provider observations at closeout

Twitch:

```text
Binding: DB_TWITCH_HOT
Database: vl_twitch_hot
Source mode: real
Collector state: ok
Fresh: true
Stale: false
Observed count: 300
Top limit: 300
Capacity state: at-or-over-window
```

Kick:

```text
Binding: DB_KICK_HOT
Database: vl_kick_hot
Source mode: authenticated
Collector state: snapshot_available
Fresh: true
Stale: false
Observed count: 100
Top limit: 100
Capacity state: at-or-over-window
```

The two capacity observations are non-blocking `watch` alerts. They are carried forward into Phase 12A 12A-0 current data and capacity baseline work. They do not authorize larger observed windows, raw-retention extension, provider combination, or stronger coverage claims.

## Independent closeout verification

A temporary closeout workflow independently queried GitHub Actions for the successful Production Smoke push run matching the exact target SHA, downloaded `production-smoke-artifacts`, and re-verified the hosted evidence.

```text
Workflow: Release Phase12 Hosted Closeout
Workflow run: 28993547481
Closeout probe head SHA: 8cfdeb8ad842c1a45d773becd18058442b79b972
Artifact id: 8188835607
Artifact digest: sha256:7b2feb1e7e73ceb14e2b85c161e791e173991e94396b3f63a914a2da303ec935
Result: pass
Verified Production Smoke run: 28993206779
Verified Production Smoke artifact: 8188712759
```

The temporary closeout workflow is removed before the closeout PR merges. Permanent monitoring ownership remains with `production-smoke.yml`.

## Phase closeout

Phase 12 is complete.

The temporary working note `docs/work-in-progress/phase12-release-readiness.md` is retired by the closeout PR according to documentation governance.

The next program is **Phase 12A Analytics Capture Foundation**. The exact next workstream is **12A-0 current data and capacity baseline**, with branch:

```text
work-analytics-12a0-current-data-capacity-baseline
```

12A-0 is evidence-only baseline work. It records current D1/storage/query/cadence/capacity facts before any analytics migration or runtime change.
