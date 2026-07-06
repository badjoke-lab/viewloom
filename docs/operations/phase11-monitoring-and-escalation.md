# Phase 11 monitoring and escalation runbook

Status: active operations contract
Owner phase: Phase 11 P11C–P11D
Monitoring owner: `.github/workflows/production-smoke.yml`
Readiness owner: `.github/workflows/public-readiness-audit.yml`

## 1. Operating model

ViewLoom uses existing GitHub Actions and public Status APIs for monitoring. Phase 11 adds no new application cron, collector cron, D1 schema, binding, or provider-combined monitoring path.

```text
Daily Production Smoke
  -> deployment identity
  -> 20 public routes
  -> Twitch status contract
  -> Kick status contract
  -> freshness
  -> capacity observation
  -> explicit 404 behavior
  -> machine-readable monitoring evidence

Weekly Public Readiness Audit
  -> built public surface
  -> route ownership
  -> metadata and not-found contract
  -> deployment metadata contract
```

## 2. Provider separation

Twitch and Kick monitoring remains separate.

```text
Twitch binding: DB_TWITCH_HOT
Twitch database: vl_twitch_hot
Twitch observation window: Top 300

Kick binding: DB_KICK_HOT
Kick database: vl_kick_hot
Kick observation window: Top 100
```

No monitor may add Twitch and Kick viewer counts, stream counts, capacity ratios, freshness, or alert counts into a combined platform total.

## 3. Evidence contract

Daily Production Smoke writes:

```text
artifacts/production-smoke/deployment.json
artifacts/production-smoke/twitch-status.json
artifacts/production-smoke/kick-status.json
artifacts/production-smoke/phase11-monitoring-evidence.json
```

Monitoring evidence schema:

```text
viewloom-phase11-monitoring-evidence-v1
```

Required evidence includes:

- expected and deployed main SHA;
- production environment and main branch identity;
- provider-specific storage binding and database;
- provider-specific collector/source state;
- freshness timestamps, age, and stale thresholds;
- observed count and observation-window limit;
- capacity state;
- Twitch `hasMore` and covered-page observation;
- Kick coverage mode and collector coverage counts when exposed;
- critical, high, and watch alerts.

## 4. Capacity classification

Capacity is an observation signal, not proof of provider-wide coverage.

```text
within-window
  observed / limit < 0.90 and no explicit hasMore signal

near-window-limit
  observed / limit >= 0.90 and < 1.00

at-or-over-window
  observed / limit >= 1.00 or Twitch hasMore == true
```

A capacity watch does not by itself fail Production Smoke. It requires review because the retained observation window may be constraining what ViewLoom can observe.

## 5. Severity and response

### Critical

Examples:

- production SHA does not match the expected main SHA;
- deployment environment is not production;
- production branch identity is not main;
- provider binding/database identity is wrong;
- required status API cannot be read or parsed.

Response:

1. Do not claim deployment or production acceptance complete.
2. Identify whether deployment, routing, binding, or API shape changed.
3. Preserve the failed artifact and run URL.
4. Repair the owning layer; do not bypass the check.
5. Re-run on the repaired latest head or next verified main deployment.

### High

Examples:

- Twitch or Kick freshness is stale;
- collector status contract indicates a failing state;
- required production status invariant fails.

Response:

1. Confirm the provider-specific collector state.
2. Compare `lastAttemptAt`, `lastSuccessAt`, and freshness age.
3. Check the provider-specific collector workflow and data binding.
4. Keep Twitch and Kick diagnosis separate.
5. Record the cause if the incident exceeds one normal collection cycle.

### Watch

Examples:

- observation window is near its configured limit;
- observation count is at the configured limit;
- Twitch reports `hasMore == true`.

Response:

1. Review the next daily evidence before changing limits.
2. Compare observed count, limit, and retained coverage mode.
3. Do not describe the data as provider-wide coverage.
4. Capacity changes require a separate approved collector/storage decision; Phase 11 does not authorize them.

## 6. Escalation ownership

```text
Deployment identity mismatch
  owner: deployment / Pages configuration

Public route failure
  owner: web route or build output

Twitch status/freshness failure
  owner: Twitch collector + DB_TWITCH_HOT path

Kick status/freshness failure
  owner: Kick collector + DB_KICK_HOT path

Capacity watch
  owner: provider-specific observation policy review

Readiness audit failure
  owner: public-surface ownership / build contract
```

## 7. Evidence retention and completion language

The GitHub Actions artifact is the run evidence. A summary without the artifact is not enough to claim a production-monitoring pass.

Use precise states:

```text
monitoring contract implemented
fixture contract passing
merged to main
production deployment identity confirmed
production monitoring evidence passing
```

Do not call a production state healthy solely because a PR merged.
