# ViewLoom SEO / GSC / GA4 baseline — 2026-09-10

Status: current measurement baseline for the bounded SEO improvement lane  
Repository baseline: `0ad026e012286b1c6b7aeb4dec00d60ca7137fcd`  
Canonical Search Console property: `sc-domain:viewloom.net`  
Linked GA4 property: `viewloom` (`properties/539584078`)

## Purpose

Record the measured search and analytics baseline before changing public search copy. This lane does not authorize collector, D1, schema, cadence, retention, backfill, provider-mixing, or geography-semantic changes.

## Search Console baseline

Latest settled Search Console data was available through 2026-09-06.

### Last 28 settled days

```text
clicks          4
impressions   450
CTR          0.8889%
avg position 34.15
```

### Last 7 settled days

```text
clicks          2
impressions   116
CTR          1.7241%
avg position 19.309
```

The sample is too small to treat the short-window movement as a stable trend.

## Existing search footholds

Observed queries include:

```text
viewloom                    position  2.333 / 3 impressions
twitch heatmap              position  7.6   / 5 impressions
streamer viewer map         position 10     / 2 impressions
the living map of twitch    position  8.5   / 2 impressions
twitch map 2026             position  9     / 1 impression
twitch history              position 38     / 4 impressions
```

The immediate opportunity is therefore not an indexing recovery. It is stronger search-intent alignment and better conversion of already-visible impressions.

## Page baseline

Representative Search Console / GA4 joined rows:

```text
/kick/heatmap       2 clicks / position  9.5   / 1 GA4 session
/kick/battle-lines  1 click  / position 15.095 / 1 GA4 session
/twitch/heatmap     1 click  / position  6.355 / 6 GA4 sessions
/kick/day-flow      0 clicks / position  7.25
/twitch/day-flow    0 clicks / position 10.481
/twitch/map         0 clicks / position 16.568
```

Major public routes inspected through Search Console were submitted and indexed with robots allowed and successful fetches. The observed SEO problem is therefore not a broad crawl/index block.

## GA4 baseline

GSC Wizard now reports the ViewLoom GA4 property linked to `sc-domain:viewloom.net`.

Last 28 settled days:

```text
sessions          117
active users       75
engagement rate 29.06%
key events           0
```

Identifiable referrals from supported AI assistants were `0` sessions in this window. Google AI Overview / AI Mode traffic is not separately identifiable from Google organic traffic by referrer.

## First implementation batch

The first bounded branch targets the pages with the clearest measured gap:

1. `/twitch/` and `/kick/`
   - replace JS-only empty provider roots with useful progressive HTML fallback content;
   - preserve the existing hydrated provider-home runtime;
   - make provider, coverage boundary, feature purpose, and internal links understandable before client JavaScript runs;
   - strengthen title/description/OG/Twitter copy without claiming provider-wide coverage.

2. `/twitch/heatmap/` and `/kick/heatmap/`
   - make platform + Heatmap explicit in title metadata;
   - describe actual tile semantics and 5-minute observation cadence;
   - keep Twitch Top 300 and Kick candidate-field boundaries explicit.

No collector, API, database, map placement semantics, public activation state, retention, or cadence changes belong in this batch.

## Deferred second batch

Search Console currently exposes inconsistent query-parameter behavior: representative Day Flow date URLs are reported as redirecting/consolidated while some Battle Lines battle/date URLs are individually indexed despite clean-base canonicals.

A later branch must first decide whether historical battle/date states are intentional search landing pages or canonicalized application state. It must not mix both policies accidentally.

Also deferred: structured-data expansion, map metadata, History copy, broader internal-link changes, and AI-referral optimization. Those should follow the first measured batch rather than be bundled into it.
