# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-25

## 1. Operating rules

- P0 production failures interrupt planned work.
- P1 defects interrupt the active phase when they block acceptance.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Local browser validation is required for W3A–W4B; hosted Preview is required for W5A.
- After every merge, issue the full merge report before beginning another PR.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7 and production acceptance complete
Channel C0-C5B and production acceptance complete
Report/export R0-R4                      complete through PR #413
Phase 5 capability audit                 complete through PR #414
Local Watchlist W0                       complete through PR #415
Local Watchlist W1                       complete through PR #416
Local Watchlist W2A                      complete through PR #417
Local Watchlist W2B                      complete through PR #418
Local Watchlist W3A                      complete through PR #419
Local Watchlist W3B                      complete through PR #420
Local Watchlist W3C                      complete through PR #421
Local Watchlist W4A                      complete through PR #422
Local Watchlist W4B                      complete through PR #423
Local Watchlist W5A                      completion candidate PR #424
Local Watchlist W5B                      next after PR #424 merge report
History UI appearance revision           pending screenshots and instructions
```

Active work:

```text
Phase 6 — Local Watchlist v1
W5A — hosted Preview acceptance
Implementation branch: work-watchlist-w5-hosted
Hosted branch: preview-watchlist-v1
PR: #424
Hosted candidate SHA: c75b4549bb50d7eb54c0135874dba63db0b7cc69
State: completion candidate
```

Governing records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
apps/web/docs/watchlist-latest-w2a-contract.md
apps/web/docs/watchlist-history-w2b-contract.md
docs/work-in-progress/watchlist-v1-working-note.md
docs/work-in-progress/watchlist-w5a-hosted-preview-note.md
```

## 3. Completed W4B record

```text
branch: work-watchlist-w4-browser
PR: #423
head: fa66656a3fecd7af932c31bb66d5bdace85b5da9
merge commit: c75b4549bb50d7eb54c0135874dba63db0b7cc69
Preview: not requested
runtime feature changes: none
```

W4B delivered:

- deterministic local browser acceptance;
- exact request-count and cache lifecycle checks;
- latest and retained failure isolation;
- cross-tab and Channel-save checks;
- desktop, tablet, mobile, storage-error, long-content, focus, touch-target, and reduced-motion evidence;
- a frozen local candidate for W5A.

## 4. Active W5A completion candidate

```text
implementation branch: work-watchlist-w5-hosted
hosted branch: preview-watchlist-v1
PR: #424
hosted candidate: c75b4549bb50d7eb54c0135874dba63db0b7cc69
branch origin: https://preview-watchlist-v1.viewloom.pages.dev
deployment origin: https://c0228ac1.viewloom.pages.dev
runtime feature changes: none
```

Deployment identity:

```text
schema: viewloom-deployment-v1
environment: preview
branch: preview-watchlist-v1
commit_sha: c75b4549bb50d7eb54c0135874dba63db0b7cc69
```

Binding evidence:

```text
Twitch: DB_TWITCH_HOT -> vl_twitch_hot
Kick:   DB_KICK_HOT -> vl_kick_hot
```

Real-data evidence:

```text
Twitch
  source mode: real
  state: partial
  latest rows: 300
  retained 30d ids: 63
  retained 7d ids: 56

Kick
  source mode: authenticated
  state: fresh
  latest rows: 100
  retained 30d ids: 59
  retained 7d ids: 51
```

Both History responses were partial. The UI rendered the partial limitation rather than claiming complete retained presence or absence.

Acceptance files:

```text
apps/web/scripts/watchlist-cloudflare-preview.mjs
.github/workflows/watchlist-hosted-preview.yml
```

Machine-readable evidence:

```text
schema: viewloom-watchlist-hosted-preview-acceptance-v1
result: pass
scenario count: 3
```

Hosted scenarios:

```text
twitch-desktop-hosted
  exact Preview identity
  Twitch binding
  real latest and retained evidence
  bounded absence language
  exact initial, period, cached restore, and refresh counts
  provider isolation
  no horizontal overflow

kick-mobile-hosted
  Kick binding
  real latest and retained evidence
  bounded absence language
  exact initial, period, cached restore, and refresh counts
  provider isolation
  no horizontal overflow
  44px general targets
  48px management targets

kick-channel-save-hosted
  saved real Kick id
  provider-specific localStorage
  zero additional requests on save
```

Accepted workflow:

```text
Watchlist Hosted Preview
run: 28162895177
result: success
accepted work-branch head: eac0d0f941818b64a357802fe3bfed02479c482a
```

Artifact matrix:

```text
watchlist-w5a-evidence.json
watchlist-w5a.log
watchlist-w5a-twitch-desktop.png
watchlist-w5a-kick-mobile.png
watchlist-w5a-channel-save.png
```

## 5. Preserved request and product contract

```text
empty initial load:             0 Heatmap + 0 History
nonempty initial load:          1 Heatmap + 1 History
uncached period change:         0 Heatmap + 1 History
cached period restore:          0 Heatmap + 0 History
combined refresh:               1 Heatmap + 1 History
Retry latest:                   1 Heatmap + 0 History
Retry History:                  0 Heatmap + 1 History
task-local list operations:     0 Heatmap + 0 History
Channel save:                   0 additional requests
```

Preserved boundaries:

- Twitch and Kick remain separate in routes, storage, requests, facts, links, and counts;
- Watchlist remains outside primary feature tabs;
- absence is not authoritative offline status;
- retained evidence is not complete history;
- no exact sessions;
- no per-channel request loop;
- no login, cloud sync, or alerts;
- no API schema or endpoint-meaning change;
- no D1 write, migration, binding, collector, cron, retention, or rollup change;
- no History UI, DOM, or CSS change.

## 6. Next approved work after W5A merge

```text
W5B — production acceptance and documentation closure
Branch: not created
```

W5B next after PR #424 merge report.

W5B must verify the exact production deployment identity, production routes, APIs, storage, Channel/Home entry points, request counts, provider separation, and responsive behavior. It must then transfer stable evidence to permanent records and delete the temporary Watchlist notes.

## 7. Phase 6 sequence

```text
W0   specification and plan                         complete PR #415
W1   model, storage, and URL state                  complete PR #416
W2A  latest Heatmap adapter/request foundation     complete PR #417
W2B  History adapter and combined evidence         complete PR #418
W3A  provider routes and storage-first shell       complete PR #419
W3B  evidence cards and approved entry points      complete PR #420
W3C  responsive/accessibility candidate pass       complete PR #421
W4A  executable contract closure                   complete PR #422
W4B  complete local browser candidate QA           complete PR #423
W5A  hosted preview-watchlist-v1 acceptance        completion candidate PR #424
W5B  production acceptance/document cleanup        next after merge report
```

## 8. Stop rule

Do not begin W5B before PR #424 is merged and its full merge report is issued.
