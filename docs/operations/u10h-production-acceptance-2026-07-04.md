# U10H production acceptance — 2026-07-04

Status: complete
Phase: U10H
Implementation PR: #471
Target production main SHA: `9f2b9abd5a3d23b50fc01075a5c4f041899babf5`
Acceptance workflow: `.github/workflows/quality-u10h-production-acceptance.yml`

## Acceptance boundary

U10H production acceptance is complete because the hosted workflow proved that production `deployment.json` matched the target main SHA and all required hosted checks passed.

Verified hosted checks:

```text
Repository-owned HTML routes: 20
Status APIs: 2
Provider crossing failures: 0
Public runtime failures: 0
Explicit 404 failures: 0
Twitch binding: DB_TWITCH_HOT
Kick binding: DB_KICK_HOT
Collector freshness required: yes
Matching production main SHA required: yes
```

## Evidence

```text
Workflow run: 28701464391
Artifact id: 8080315127
Artifact digest: sha256:6de6e9371ea77e9b46a220fdabdc1db0ca63b74f55b8aa9eb52a1761b6a4f604
Result: pass
Expected main SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5
Deployed SHA: 9f2b9abd5a3d23b50fc01075a5c4f041899babf5
Checked at: 2026-07-04T09:08:03Z
```

Machine-readable evidence recorded by the workflow:

```text
schema: viewloom-quality-u10h-production-acceptance-v1
phase: U10H
result: pass
html_routes: 20
status_apis: 2
provider_crossing_failures: 0
public_runtime_failures: 0
explicit_404_failures: 0
providers_separate: true
```

U10H production acceptance is claimed complete by this record.
