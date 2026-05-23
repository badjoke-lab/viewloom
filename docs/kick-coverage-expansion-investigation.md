# Kick coverage expansion investigation

## Purpose

Kick collection currently uses official livestreams as the primary source and returns 100 streams per snapshot.

Current production behavior:

```text
source: official livestreams primary
stream_count: 100
collection interval: 5 minutes
targetSource: official-livestreams
coverageMode: official-livestreams
```

This document defines what must be checked before trying to expand Kick coverage beyond the current Top 100 observed streams.

## Current baseline

The current Kick baseline is acceptable for MVP visibility but not equivalent to broad Twitch coverage.

Known current state:

- Heatmap shows 100 streams.
- Day Flow, Battle Lines, and History read from the same DB_KICK_HOT snapshots.
- Battle Lines is explicitly 5-minute based.
- History viewer-minutes are weighted by observed interval capped at 5 minutes.
- The API should describe the current dataset as observed official livestreams, not as all of Kick.

## Key question

Can ViewLoom safely expand Kick coverage beyond 100 streams?

The answer is not assumed. It must be determined by probing API behavior and reviewing operational impact.

## Investigation targets

### 1. Limit behavior

Check whether the official livestreams endpoint accepts values above 100.

Test values:

```text
limit=100
limit=200
limit=500
```

Record:

- HTTP status
- returned item count
- error body, if any
- whether counts are capped at 100
- whether response schema changes

### 2. Pagination / cursor / page behavior

Check whether any pagination mechanism exists or is accepted.

Candidate query names to test cautiously:

```text
cursor
page
offset
after
before
```

Do not adopt undocumented parameters without confirming stable behavior.

Record:

- whether the parameter is accepted
- whether the second page differs from the first
- duplicate rate across pages
- whether ordering remains stable

### 3. Category split collection

If global pagination is not available, check whether category-filtered collection can expand practical coverage.

Potential approach:

```text
GET official livestreams by category_id
merge/dedupe by slug
```

Risks:

- category discovery may need another endpoint
- duplicates across categories
- uneven coverage
- higher API usage
- more complicated explanation to users

### 4. Language split collection

If language filtering exists, check whether language-filtered collection can expand coverage.

Potential approach:

```text
GET official livestreams by language
merge/dedupe by slug
```

Risks:

- incomplete language labels
- duplicate streams
- more API calls
- unclear UX meaning

### 5. Stats endpoint usefulness

Check whether a livestreams stats endpoint can expose total live count or global totals.

Possible use even if Top 100 remains the only stream list:

```text
Heatmap: Top 100 observed streams
Status: total live streams / total viewers if available
Coverage note: Top 100 of N live streams
```

## Acceptance criteria for expanding beyond 100

Expansion is acceptable only if:

- The API behavior is stable and repeatable.
- No obvious rate-limit or auth errors occur during short probes.
- Duplicate rate is manageable.
- The added streams materially improve Heatmap / Day Flow / History value.
- D1 storage and API response sizes remain acceptable.
- Browser Heatmap remains usable.
- Coverage wording remains honest.

## Stop criteria

Do not expand beyond 100 if:

- The endpoint hard-caps at 100.
- Pagination is not documented or returns duplicates / unstable data.
- Category/language split creates misleading coverage.
- API usage grows too much for current zero/low-cost operation.
- The UI becomes noisy or slow.

## Current recommended product wording

Until expansion is proven, use wording like:

```text
Kick: Top 100 official livestreams observed
```

Do not say:

```text
All Kick streams
Full Kick coverage
Complete Kick live map
```

## Probe output template

For every probe, record:

```text
date:
endpoint:
query:
status:
item_count:
unique_slugs:
duplicate_count:
has_next_or_cursor:
first_10_slugs:
error_body:
notes:
```

## Relationship to other work

This investigation does not solve:

- comment/activity heat sampling
- Twitch page expansion
- browser QA
- mobile layout QA
- long-term History completeness

It only determines whether Kick coverage can responsibly move beyond Top 100.

## Decision path

1. Keep production at Top 100 for now.
2. Run one-off limit and pagination probes.
3. If limit/pagination fails, test whether stats endpoint can improve coverage labeling.
4. Only consider category/language split after confirming it does not mislead users.
5. Update product wording and API metadata based on findings.
