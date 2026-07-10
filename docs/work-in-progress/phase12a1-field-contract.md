# Phase 12A-1 analytics field contract

Status: active
Branch: `work-analytics-12a1-field-contract`

## Purpose

Freeze provider-specific minimum field contracts before 12A-2 migration design.

12A-1 decides field semantics, provenance, evidence strength, unsupported states, and source-contract versioning. It does not perform migration or enable new runtime capture.

## Permanent candidate package

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/product/analytics-field-contract-v1.md
scripts/verify-12a1-field-contract.mjs
.github/workflows/analytics-12a1-field-contract.yml
```

## Decisions

### Twitch `started_at`

```text
current code status: fetched, used, then discarded
future retention decision: approved
internal field: provider_started_at
evidence strength: provider_reported_start_time
exact session boundary claim: prohibited
```

### Kick `provider_started_at`

```text
current primary-path source verification: absent
future retention decision: unapproved
availability: unavailable until source verification
exact session boundary claim: prohibited
```

### Category contract

Normalized category evidence slots are defined, but provider capture is not automatically approved.

```text
Twitch category capture: unapproved pending source verification
Kick category capture: unapproved pending accepted live primary official-livestreams evidence
cross-provider category identity equivalence: prohibited
```

The Kick official-livestreams probe is extended to record category candidate fields and keys. A live primary-path sample must show stable category identity and/or category name fields before capture approval.

## 12A-2 handoff

12A-2 may design compact storage using approved baseline/observed-run fields and provider-approved `provider_started_at` evidence where available.

12A-2 must not assume exact session boundaries, Kick start-time availability, category capture approval, or cross-provider category identity equivalence.

## Prohibited changes

```text
D1 migration
collector runtime normalization change
snapshot payload schema change
compact-rollup generation
raw-retention extension
new high-frequency cron
analytics UI
unverified category capture
exact-session claims
cross-provider totals/rankings/baselines/relationships
```

## Completion sequence

```text
1. field/source contracts pass verifier
2. evidence-only/runtime boundary passes
3. latest-head CI passes
4. permanent 12A-1 acceptance is recorded
5. canonical state advances to 12A-2 design and migration
6. squash merge
```
