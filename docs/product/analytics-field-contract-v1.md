# ViewLoom Analytics Field Contract v1

Status: current 12A-1 contract
Contract version: `analytics-source-v1`

## Purpose

This contract defines the minimum provider-specific fields that later ViewLoom baseline, observed-run, and category work may use.

It is a source and field contract only. It does not add a D1 migration, compact-rollup generation, analytics UI, retention extension, or cross-provider analytics.

Permanent machine-readable authorities:

```text
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
```

12A-0 baseline authority:

```text
docs/audits/12a0-current-data-capacity-baseline.json
```

## Provider separation

Twitch and Kick remain separate contracts.

A shared internal field name means that ViewLoom can process the same analytical concept. It does not mean that upstream provider identities, categories, sessions, or coverage models are equivalent.

The following are prohibited:

```text
cross-provider global channel identity inferred from names
cross-provider category identity inferred from labels
cross-provider session identity
combined-provider baseline population
combined-provider category ranking
```

## Baseline minimum fields

### Twitch

```text
channel_key        <- channelLogin
 display_name      <- displayName
viewer_count       <- viewers
bucket_minute      <- snapshot bucket
collected_at       <- collector completion timestamp
source_mode        <- real
coverage_state     <- bounded observation state
covered_pages      <- Twitch pagination coverage evidence
has_more           <- whether the bounded window has additional upstream pages
```

Coverage contract: bounded top-window observation. The current contract does not claim full Twitch coverage.

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

Coverage contract: bounded official-livestreams observation. The current contract does not claim full Kick coverage.

## Observed-run minimum fields

The shared minimum inputs are:

```text
channel_key
bucket_minute
viewer_count
observation_coverage_state
```

ViewLoom may derive:

```text
first_observed_at
last_observed_at
observed span
observed peak
observed median
observed first/last viewer values
```

These are observation-derived boundaries, not authoritative session boundaries.

The contract does not allow claims of:

```text
exact session id
exact stream start solely from observation boundary
exact stream end
authoritative offline state
```

## Twitch `started_at` decision

Current code fetches Twitch `started_at`, uses it to derive the age-based activity proxy, and discards it before snapshot serialization.

12A-1 decision:

```text
future retention: approved
internal field: provider_started_at
evidence strength: provider_reported_start_time
exact session start claim: not allowed
exact session end claim: not allowed
session identity claim: not allowed
```

The purpose of retaining `provider_started_at` is to preserve provider-reported boundary evidence that cannot be reconstructed later from daily rollups.

The future capture implementation belongs to a later approved capture/migration step. 12A-1 itself does not change runtime storage.

## Kick start-time decision

No equivalent start-time field is verified on the current primary Kick official-livestreams path.

Contract state:

```text
provider_started_at availability: unavailable
future retention: unapproved until source verification
exact session start claim: not allowed
exact session end claim: not allowed
session identity claim: not allowed
```

Observed-run work for Kick must use ViewLoom observation-derived first/last boundaries unless a future versioned source contract proves stronger evidence.

## Normalized category fields

The internal category evidence slots are:

```text
category_provider_id
category_name
category_source
category_observed_at
category_evidence_strength
category_contract_version
```

`category_provider_id` is always provider-native. It is never a ViewLoom global category id and never proves Twitch/Kick identity equivalence.

### Twitch category status

```text
current retention: no
contract evidence verification: incomplete
capture approved: no
approval owner: 12A-4
```

### Kick category status

The current primary collector path is `public/v1/livestreams`. Its current normalizer retains only slug, display name, title, viewer count, and URL.

A separate official channel parser can inspect a `category` object and may use `category.name` as title fallback. That does not prove that the primary official-livestreams path exposes a stable category identity/name shape suitable for capture.

Contract state:

```text
primary-path category shape: unverified
capture approved: no
probe: workers/collector-kick/scripts/probe-kick-official-livestreams.mjs
approval rule: accepted live primary-path evidence must show stable category identity and/or category name fields
approval owner: 12A-4
```

The probe records category candidate fields and nested/top-level category keys. Until accepted live evidence exists, schema work must treat Kick category capture as unapproved.

## Explicitly unsupported fields

The current contract marks these unavailable for both providers:

```text
exact_session_id
authoritative_stream_end_at
authoritative_offline_state
unique_viewers
exact_creator_revenue
```

Unsupported fields must remain explicit rather than being synthesized from incomplete observations.

## Contract versioning

Current source contract:

```text
analytics-source-v1
```

A version bump is required when any of these semantics change:

```text
provider endpoint replacement
channel identity source change
coverage model change
category identity semantic change
provider start-time semantic change
```

Additional probe evidence or availability statistics that do not change semantics may be added without a contract version bump.

## 12A-2 handoff boundary

12A-2 may design compact intraday storage using:

```text
channel_key
bucket_minute
viewer_count
observation_coverage_state
provider_started_at only when provider-approved and available
```

12A-2 must not assume:

```text
exact session boundaries
Kick provider_started_at availability
category capture approval
cross-provider category identity equivalence
```

Migration is not authorized by this document alone. 12A-2 must still compare row, byte, retention, and query costs against the accepted 12A-0 capacity baseline.
