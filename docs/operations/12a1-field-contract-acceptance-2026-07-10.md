# 12A-1 analytics field contract acceptance

Date: 2026-07-10
Workstream: 12A-1 analytics field contract
Status: accepted candidate

## Candidate identity

```text
PR: #492
Accepted candidate head: 83b2a0f937216c7afe04d0644958239679ed02b8
Field-contract workflow: Analytics 12A1 Field Contract
Field-contract run: 29096353423
No-runtime workflow: Analytics 12A1 No Runtime Change
No-runtime run: 29096353282
```

Both dedicated gates passed on the candidate head. The field-contract gate verified the machine-readable contracts, human contract, Kick category probe evidence shape, and development policy. The no-runtime gate verified that no runtime/data-path files changed and that worker-tree changes were limited to the read-only Kick official-livestreams probe script.

## Accepted permanent package

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/product/analytics-field-contract-v1.md
scripts/verify-12a1-field-contract.mjs
```

## Accepted decisions

### Twitch `started_at`

```text
current status: fetched, used, then discarded
future retention: approved
internal field: provider_started_at
evidence strength: provider_reported_start_time
exact session-start claim: prohibited
exact session-end claim: prohibited
session identity claim: prohibited
```

The decision preserves useful provider-reported boundary evidence for later capture work without reclassifying it as an authoritative ViewLoom session boundary.

### Kick start time

```text
primary-path field verification: absent
future retention: unapproved
availability: unavailable until source verification
exact session-start claim: prohibited
exact session-end claim: prohibited
session identity claim: prohibited
```

Observed-run work must continue using ViewLoom observation-derived boundaries unless a future versioned source contract proves stronger Kick evidence.

### Category contract

The normalized internal evidence slots are accepted:

```text
category_provider_id
category_name
category_source
category_observed_at
category_evidence_strength
category_contract_version
```

Provider capture remains unapproved:

```text
Twitch category capture: false
Kick category capture: false
cross-provider category identity equivalence: false
```

The Kick official-livestreams probe now records candidate category ids, names, top-level category-related keys, and nested category keys. No credentialed live probe evidence is claimed by this acceptance record. Kick category capture remains blocked until accepted live evidence from the primary official-livestreams path satisfies the contract approval rule.

## Unsupported fields retained as explicit unavailable states

```text
exact_session_id
authoritative_stream_end_at
authoritative_offline_state
unique_viewers
exact_creator_revenue
```

The contract does not synthesize these fields from incomplete observations.

## Versioning result

Current source contract version:

```text
analytics-source-v1
```

A version bump is required for endpoint replacement, channel identity source change, coverage model change, category identity semantic change, or provider start-time semantic change.

## 12A-2 handoff boundary

12A-2 may design compact intraday storage using approved baseline and observed-run evidence fields. It must not assume exact session boundaries, Kick start-time availability, category capture approval, or cross-provider category identity equivalence.

12A-2 migration is still not authorized until provider-specific row/day, byte/day, retained-size, index, and query costs are estimated against the accepted 12A-0 capacity baseline.

## Scope acceptance

The accepted candidate includes no:

```text
D1 migration
collector runtime normalization change
snapshot payload schema change
compact-rollup generation
retention change
cron change
analytics UI
category capture activation
exact-session claim
cross-provider analytics
```

After this acceptance record is included, latest-head gates must pass again before merge.
