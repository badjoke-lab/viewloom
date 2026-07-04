# Phase 11 acceptance and operations working record

Status: active
Branch: `work-quality-phase11-acceptance-operations`
Started: 2026-07-04
Entry main commit: `48d988e7a994a39a4300b02997cb7e1c7a5d242b`
Previous phase: U10H production acceptance complete PR #471, canonical closeout PR #472

## Purpose

Phase 11 converts the repaired public surface into a maintainable quality and operations system. It does not add product features.

## Workstreams

```text
P11A strict-null baseline and staged type-safety migration
P11B CI ownership and duplication audit
P11C deployment identity, provider status, freshness, and capacity monitoring contract
P11D failure runbooks and escalation ownership
P11E weekly / monthly / quarterly maintenance cadence
P11F all-public acceptance ownership closeout
P11G Phase 11 final acceptance and canonical closeout
```

## Entry facts

```text
U10H production acceptance: pass
Accepted production SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5
Hosted acceptance run: 28701464391
Hosted acceptance artifact: 8080315127
Twitch and Kick separation: required
New API / D1 / collector / cron / retention work: not authorized
```

## P11A strict-null migration rule

The repository base config already has `strict: true`, while the current web scripts override `strictNullChecks` to false. Phase 11 removes that debt in bounded stages.

Rules:

- measure app and Functions scopes separately before repair;
- record error count and affected-file count as machine-readable evidence;
- do not use blanket `any`, mass non-null assertions, or behavior-changing casts to force green;
- add payload guards and explicit nullable state handling at browser and Functions boundaries;
- preserve existing browser, output, URL, degraded-state, and provider-separation gates;
- remove each command-line override only after its scope is genuinely clean.

## P11B CI rule

- inventory workflows and assertion ownership before deleting anything;
- unique feature gates remain;
- overlapping gates may retire only when replacement assertions are named and verified;
- latest-head cancellation remains mandatory;
- all-public browser coherence remains protected.

## P11C–P11E operations rule

Use existing Status APIs and GitHub Actions before adding any new scheduled runtime work. Operations must cover deployment identity, provider-specific status contracts, freshness/capacity observation, failure ownership, escalation, and periodic maintenance.

## Current status

```text
Phase 11 branch created: yes
P11A baseline gate: being added
P11B CI audit: not started
P11C monitoring contract: not started
P11D runbooks: not started
P11E maintenance cadence: not started
P11F all-public ownership closeout: not started
P11G final acceptance: not started
```
