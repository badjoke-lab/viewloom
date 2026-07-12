# 12A-3 bounded generator enablement acceptance

Date: 2026-07-12
Status: production rows accepted; enabled collector deployment pending merge

## Evidence identity

```text
PR: #510
Head SHA: 33686a8409a685e3fe5dbe3b770741f57b3992ef
Workflow run: 29190852420
Artifact: phase12a3-generator-enablement-freeze
Observed at: 2026-07-12T11:27:48.944Z
Permanent evidence: docs/audits/12a3-generator-enablement-evidence.json
```

## Twitch

```text
days: 2026-07-11, 2026-07-12
source snapshots: 288, 138
rollup rows: 600, 600
candidate streamers: 1996, 1232
first-pass Worker wall: 2671 ms
first-pass D1 duration: 1655.268 ms
second-pass observations unchanged: true
provider gate: true
```

## Kick

```text
days: 2026-07-11, 2026-07-12
source snapshots: 288, 138
rollup rows: 200, 200
candidate streamers: 739, 459
first-pass Worker wall: 1849 ms
first-pass D1 duration: 815.371 ms
second-pass observations unchanged: true
provider gate: true
```

## Gate

```text
generatorEnablementGatePass: true
productionGenerationStarted: true
temporaryWorkersRetained: false
backfillPerformed: false
newCronAdded: false
```

The actual provider-specific today/yesterday rows and status records are accepted. The two enabled collector Wrangler configurations may be merged and deployed. Post-merge deployment and ongoing accumulation still require verification.
