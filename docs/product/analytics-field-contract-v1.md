# ViewLoom Analytics Field Contract v1

Status: current 12A-1 contract with accepted 12A-4 category source evidence  
Contract version: `analytics-source-v1`  
Category source contract: `category-source-v1`

## Purpose

This contract defines the minimum provider-specific fields that later ViewLoom baseline, observed-run, and category work may use. It does not authorize a D1 migration, runtime category capture, analytics UI, retention extension, backfill, or cross-provider analytics.

Permanent machine-readable authorities:

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a4-category-source-audit-evidence.json
```

## Provider separation

Twitch and Kick remain separate contracts. Shared internal names do not imply equivalent provider identities, categories, sessions, or coverage models.

Prohibited:

```text
cross-provider channel identity inferred from names
cross-provider category identity inferred from labels
cross-provider session identity
combined-provider baseline population
combined-provider category ranking
```

## Baseline minimum fields

### Twitch

```text
channel_key        <- channelLogin
display_name       <- displayName
viewer_count       <- viewers
bucket_minute      <- snapshot bucket
collected_at       <- collector completion timestamp
source_mode        <- real
coverage_state     <- bounded observation state
covered_pages      <- pagination coverage evidence
has_more           <- bounded-window continuation evidence
```

### Kick

```text
channel_key        <- slug
display_name       <- displayName
viewer_count       <- viewer_count
bucket_minute      <- snapshot bucket
collected_at       <- collector completion timestamp
source_mode        <- persisted source mode
target_source      <- primary target source
coverage_mode      <- source-specific coverage contract
coverage_state     <- bounded observation state
```

Neither provider contract claims full-platform coverage.

## Observed-run fields

Shared minimum inputs:

```text
channel_key
bucket_minute
viewer_count
observation_coverage_state
```

ViewLoom may derive first/last observed boundaries, observed span, observed peak, and observed median. These are observation-derived boundaries, not authoritative session boundaries.

### Twitch provider start evidence

```text
upstream field: started_at
future retention: approved
internal field: provider_started_at
evidence strength: provider_reported_start_time
exact session start/end claim: not allowed
session identity claim: not allowed
```

### Kick provider start evidence

```text
provider_started_at availability: unavailable
future retention: unapproved until source verification
exact session start/end claim: not allowed
session identity claim: not allowed
```

## Normalized category fields

```text
category_provider_id
category_name
category_source
category_observed_at
category_evidence_strength
category_contract_version
```

`category_provider_id` is always provider-native and never a ViewLoom global category id.

### Twitch category source

Accepted by the 12A-4-0 live source audit in PR #513:

```text
primary endpoint: https://api.twitch.tv/helix/streams
provider id path: game_id
name path: game_name
field presence: 100 / 100 across two live probes
capture approved: yes
runtime capture started: no
evidence strength: provider_primary_live_api
```

### Kick category source

Accepted by the 12A-4-0 live source audit in PR #513:

```text
primary endpoint: https://api.kick.com/public/v1/livestreams
provider id path: category.id
name path: category.name
field presence ratio: 1.0 across two 100-row live probes
capture approved: yes
runtime capture started: no
evidence strength: provider_primary_live_api
```

The official channel and public channel fallback paths also exposed category candidates, but alternate evidence cannot substitute for primary official-livestreams approval.

## Coverage language

Category source approval means that the accepted upstream fields exist and may enter a storage-design gate. It does not mean every retained observation will contain a category, full provider coverage exists, category identity is stable across providers, or runtime capture has started.

Future capture must distinguish at least:

```text
observed
missing_from_source
not_in_bounded_window
partial_source_coverage
stale
unavailable
```

## Explicitly unsupported fields

```text
exact_session_id
authoritative_stream_end_at
authoritative_offline_state
unique_viewers
exact_creator_revenue
```

## Contract versioning

`analytics-source-v1` remains current because the source audit completed an already-defined provider-specific category slot without changing its semantics. `category-source-v1` identifies the accepted provider paths.

A version bump is required for provider endpoint replacement, identity-source change, coverage-model change, category-identity semantic change, or provider start-time semantic change.

## 12A-4 handoff boundary

12A-4 storage design may use the normalized category fields and accepted provider paths. It must not assume cross-provider identity equivalence, combined-provider category ranking, runtime capture approval, category UI approval, backfill approval, or migration approval.
