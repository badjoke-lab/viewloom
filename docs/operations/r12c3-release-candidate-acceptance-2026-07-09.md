# R12C-3 release candidate acceptance — 2026-07-09

Status: candidate accepted
Phase: Phase 12
Workstream: R12C-3
Permanent evidence: `../audits/r12c3-candidate-acceptance.json`
Candidate contract: `../audits/r12c3-release-candidate-contract.json`

## Accepted candidate evidence

```text
Candidate head SHA: 52584565ae3ac4b10509df68c90692915f7fe475
Workflow run: 28992701959
Artifact id: 8188563767
Artifact name: r12c3-candidate-acceptance
Artifact digest: sha256:e81cdbce17fb5a97285d1dbddce768fea7b0332705ab0afa424619db656c90d6
Result: candidate_pass
```

## Candidate checks completed

The exact candidate head passed:

```text
development policy
R12C-3 candidate contract
R12C-0 message inventory verification
R12C-1 launch copy package verification
R12C-2 launch asset package binary/hash verification
R12B-1 and R12B-2 permanent acceptance-record verification
full web typecheck
production build
Content QA
SEO QA
public-surface inventory verification
current public-state handoff verification
Public Readiness
100-scenario Public Browser matrix
candidate Support-to-Stripe transition acceptance
candidate Refund/Disclosure consistency acceptance
candidate evidence build and verification
```

## Public surface result

```text
HTML routes: 25
Inventory entries: 26
Public Readiness pages: 25
Production Smoke route ownership: 25
Browser routes: 25
Browser viewports: 4
Browser scenarios: 100
Browser violations: 0
Provider crossing scenarios: 0
Provider-neutral API request scenarios: 0
Overflow scenarios: 0
Focus failures: 0
Unlabeled-control scenarios: 0
Legal mobile target failures: 0
```

## Provider-separation result

```text
Twitch binding: DB_TWITCH_HOT
Kick binding: DB_KICK_HOT
Combined totals allowed: false
Combined rankings allowed: false
```

The candidate does not authorize cross-provider totals, rankings, baselines, relationships, or analytical claims.

## Launch asset result

```text
Assets: 6
Capture result: pass
Frozen package verification: pass
```

The package remains the repo-owned current product screenshot set established by R12C-2.

## Candidate Support transition result

```text
Result: pass
Navigation origin: local candidate preview
Payment destination: existing Stripe-hosted Payment Link
Desktop HTTP: 200
Desktop overflow: 0px
Mobile HTTP: 200
Mobile overflow: 0px
Mobile CTA height: 44px
Violations: 0
```

This acceptance proves the candidate page behavior and transition contract. It does not prove any current Stripe Dashboard/account state that is outside repository/public-browser evidence.

## Candidate Refund/Disclosure result

```text
Result: pass
Navigation origin: local candidate preview
Canonical origin: https://vl.badjoke-lab.com
Page scenarios: 8
Mobile Back/return flows: 2
Violations: 0
```

The local candidate navigation origin and production canonical origin were checked independently.

## Decision

The R12C-3 premerge release candidate is accepted.

Candidate merge alone does not complete Phase 12. The remaining release gate is:

```text
merge accepted candidate
  -> wait for exact merged main SHA in /deployment.json
  -> run hosted production smoke and monitoring acceptance
  -> create permanent Phase 12 release acceptance evidence
  -> retire the temporary Phase 12 working note
  -> advance canonical execution to Phase 12A Analytics Capture Foundation
```

Phase 12A remains blocked until the hosted exact-SHA closeout completes.
