# Phase 12 release acceptance — 2026-07-09

Status: complete
Phase: Phase 12 — English release readiness
Final workstream: R12C-3 production closeout
Permanent machine evidence: `../audits/phase12-release-acceptance.json`
Production closeout contract: `../audits/phase12-production-closeout-contract.json`
Candidate evidence: `../audits/r12c3-candidate-acceptance.json`

## Exact production identity

```text
Expected merged main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:             32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Environment: production
Branch: main
Identity match: true
```

## Hosted closeout evidence

```text
Workflow: Release Phase12 Production Closeout
Workflow run: 28993366876
Artifact id: 8188770286
Artifact name: phase12-production-closeout
Artifact digest: sha256:70bf5b26c06813daa122ef0658efb1480efd569d740b4787449619d7124c757b
Result: pass
```

## Hosted public-surface acceptance

```text
Repository-owned HTML routes: 25
HTML status failures: 0
ViewLoom ownership failures: 0
Canonical ownership failures: 0
Provider status APIs: 2
Sitemap status: 200
Sitemap URLs: 21
Launch assets: 6
Launch asset HTTP failures: 0
Launch asset hash mismatches: 0
Launch asset byte-size mismatches: 0
Blocking monitoring alerts: 0
Watch alerts: 2
Explicit 404: pass
Preview probe absent from production: pass
```

The two watch alerts are capacity observations, not blocking failures:

```text
Twitch: at-or-over-window, observed 300 / top limit 300, hasMore true
Kick:   at-or-over-window, observed 100 / top limit 100
```

These observations carry forward into Phase 12A-0 as capacity-baseline evidence. They do not authorize expanding collection limits.

## Provider acceptance

### Twitch

```text
HTTP: 200
Platform: twitch
Binding: DB_TWITCH_HOT
Database: vl_twitch_hot
Source mode: real
Collector state: ok
Stale: false
Observed: 300
Top limit: 300
Has more: true
Covered pages: 3
```

### Kick

```text
HTTP: 200
Platform: kick
Binding: DB_KICK_HOT
Database: vl_kick_hot
Source mode: authenticated
Collector state: snapshot_available
Fresh: true
Stale: false
Observed: 100
Top limit: 100
```

Twitch and Kick remain separate across bindings, storage, routes, coverage models, rankings, exports, baselines, relationships, and analytical claims.

## Support and legal acceptance

Hosted `/support/` passed:

```text
HTTP: 200
Exact Stripe Payment Link present: true
Refund Policy link present: true
Commercial Disclosure link present: true
Contact link present: true
```

The permanent R12B external-state boundary remains unchanged: public/repository evidence proves the user-facing transition and consistency contracts, not unobserved current Stripe Dashboard/account state.

## Launch asset acceptance

All six repo-owned R12C-2 launch assets returned HTTP 200 and matched the frozen manifest SHA-256 and byte size:

```text
viewloom-desktop.png
viewloom-mobile.png
twitch-heatmap.png
twitch-day-flow.png
twitch-battle-lines.png
twitch-history.png
```

## Candidate evidence carry-forward

The production closeout retains the R12C-3 candidate evidence:

```text
Candidate status: candidate_pass
Candidate head SHA: 52584565ae3ac4b10509df68c90692915f7fe475
Candidate workflow run: 28992701959
Candidate artifact id: 8188563767
Candidate browser scenarios: 100
Candidate browser violations: 0
```

Final documentation-only candidate head validation also passed on head `9f971a9a5f307c190d57f6a0ed0a8828a72262b8` in dedicated run `28992998420`.

## Phase 12 completion decision

Phase 12 is complete.

Completed sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 candidate acceptance                        complete
R12C-3 exact production SHA closeout                complete
```

The next active program is Phase 12A Analytics Capture Foundation.

The first workstream is 12A-0 current data and capacity baseline. It must record current D1 row counts, payload size, oldest/latest raw bucket, daily-rollup counts, collector duration, relevant query timings, source modes, coverage behavior, cadence/retention behavior, current field matrix, and upstream fields discarded before storage. No runtime change is allowed in 12A-0.

Exact next implementation branch: `work-analytics-12a0-capacity-baseline`
