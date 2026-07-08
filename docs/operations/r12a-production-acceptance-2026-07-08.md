# R12A production acceptance — 2026-07-08

Status: complete
Phase: Phase 12
Workstream: R12A-5
Implementation PR: #477
Implementation merge SHA: `952f0008209363f4fd5b22587975ac247ee8d6f2`
Machine-readable evidence: `../audits/r12a-production-acceptance.json`
Workflow run: `28941169278`

## Accepted production boundary

```text
Expected main SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
Deployed SHA:      952f0008209363f4fd5b22587975ac247ee8d6f2
Repository-owned HTML routes: 25
Provider status APIs: 2
Provider crossing failures: 0
Blocking monitoring alerts: 0
Watch alerts: 2
Explicit 404: pass
Result: pass
```

## R12A surfaces accepted

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commercial-disclosure/
```

All five routes returned the expected ViewLoom pages in production. About and Support use the provider-neutral static entry and remain in the same accepted 25-route ownership set.

## Provider observations

```text
Twitch capacity: at-or-over-window 300/300
Kick capacity:   at-or-over-window 100/100
```

These are non-blocking watch observations. They remain inputs to the future Phase 12A analytics capacity baseline and do not authorize observed-window expansion, retention expansion, or provider combination.

## Closeout decision

R12A is production accepted. The five policy/support surfaces move from candidate to resolved. The next active Phase 12 workstream is R12B-0 evidence and configuration audit.

R12B must distinguish repository facts from external Stripe dashboard/account facts. Repository code alone cannot prove registered website state, Payment Link account configuration, or refund settings.
