# Phase 11 maintenance cadence

Status: active operations contract
Owner phase: Phase 11 P11E

## Purpose

This cadence keeps ViewLoom's public surface, provider separation, monitoring evidence, CI ownership, and retained data claims reviewable without adding new application cron work.

The cadence uses existing evidence sources:

```text
Daily
  Production Smoke

Weekly
  Public Readiness Audit

Monthly
  operator review of existing artifacts and CI ownership inventory

Quarterly
  architecture / retention / capacity / documentation review
```

## Daily automated evidence

Owner: `.github/workflows/production-smoke.yml`

Review when the workflow fails or produces watch alerts.

Required evidence:

- deployment identity matches expected main SHA;
- 20 public routes respond and remain owned;
- Twitch status contract passes;
- Kick status contract passes;
- DB bindings remain provider-specific;
- freshness remains inside accepted thresholds;
- capacity state is recorded for each provider separately;
- explicit 404 behavior remains correct;
- monitoring artifact is uploaded.

No manual action is required for an ordinary passing run with zero blocking alerts.

## Weekly automated evidence

Owner: `.github/workflows/public-readiness-audit.yml`

Expected schedule:

```text
23 2 * * 1
```

Weekly review covers:

- built public-surface ownership;
- linked changelog data;
- explicit not-found page contract;
- deployment metadata contract;
- readiness artifact availability.

A weekly readiness failure is investigated separately from provider collector failures.

## Monthly operator review

The monthly review does not create a new scheduled workflow. It reviews existing evidence.

Checklist:

1. Review the latest successful and latest failed Production Smoke artifacts.
2. Compare Twitch and Kick capacity states separately.
3. Review recurring watch alerts and whether the same provider approaches its observation-window limit repeatedly.
4. Review latest freshness age versus stale and strong-stale thresholds.
5. Run or review the Phase 11 CI ownership inventory.
6. Confirm `workflowsMissingLatestHeadCancellation == 0`.
7. Review workflow additions and verify every new PR workflow has same-PR cancellation unless explicitly documented.
8. Review machine-readable evidence schemas for accidental incompatible changes.
9. Check that current roadmap, schedule, working record, and permanent evidence still agree.
10. Review open operational issues and stale temporary work-in-progress files.

Record a short monthly note only when the review finds an action, exception, or repeated watch signal. Do not create empty maintenance records merely to satisfy cadence.

## Quarterly review

The quarterly review is deliberate and cross-cutting.

### Architecture

- confirm one authoritative controller/state owner per public feature route;
- confirm no global fetch/history/prototype interception has returned;
- confirm no document-wide MutationObserver is used as primary feature coordination;
- confirm legacy compatibility layers still have documented reasons or retirement plans.

### Provider separation

- verify Twitch/Kick routes, APIs, bindings, storage, collectors, rankings, exports, and monitoring evidence remain separate;
- verify no combined viewer total or combined ranking exists;
- verify monitoring does not aggregate provider counts into a combined platform health score.

### Retention and capacity

- review raw and rollup retention against the approved operating model;
- review capacity watch frequency by provider;
- do not change Top limits, collector cadence, retention, D1 schema, or bindings without a separately approved change.

### CI ownership

- compare workflow count and ownership to the latest P11B inventory;
- classify new overlap before retirement;
- retire a workflow only when replacement assertions are named and passing;
- preserve all-public browser coherence and unique feature gates.

### Documentation and operations

- verify runbook owners still match actual workflows and APIs;
- verify production completion language still requires deployed SHA and smoke evidence;
- review exception records and remove expired exceptions;
- close or renew temporary working records deliberately.

## Escalation triggers from cadence

Create follow-up work when any of the following repeats or persists:

```text
critical/high monitoring alert
freshness failure beyond one normal collection cycle
capacity watch recurring across multiple daily runs
latest-head cancellation gap reappears
monitoring schema cannot represent a new provider-specific status condition
runbook owner no longer matches implementation ownership
temporary compatibility layer has no remaining evidence-backed purpose
```

Cadence review does not itself authorize collector, storage, retention, provider-combination, localization, or feature expansion.
