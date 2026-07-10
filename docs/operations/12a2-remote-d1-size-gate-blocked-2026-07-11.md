# 12A-2 remote D1 size gate blocked record

Date: 2026-07-11
Workstream: 12A-2 compact intraday rollup design and migration
Status: blocked before migration

## Evidence identity

```text
PR: #495
Evidence head: 7558091e9585e09596b01c6f38ccdbe322c94666
Workflow: Analytics 12A2 Remote D1 Size Gate
Workflow run: 29112267006
Artifact: phase12a2-remote-d1-size-gate
Artifact ID: 8235231905
Artifact digest: sha256:6874e20ac3d6d5a93facb5733ec486837c8a437143952a5d6982e1167676bcd9
Generated at: 2026-07-10T17:48:34.908Z
Permanent evidence: docs/audits/12a2-remote-d1-size-evidence.json
```

## Result

The remote size workflow did not collect current D1 database sizes because the repository workflow environment did not expose the required Cloudflare evidence credentials.

Recorded blocker:

```text
cloudflare_credentials_missing
```

Required repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

No secret values were printed or persisted. No account id, unrelated database names, or raw control-plane responses are present in the normalized artifact.

## Gate state

```text
Twitch remote size gate: false
Kick remote size gate:   false
Account storage gate:    false
Migration storage gate:  false
Migration authorized:    false
```

These false states mean **not measured / blocked**, not capacity failure. No claim is made about current remote D1 size, projected utilization, or remaining headroom.

## What remains accepted

The local design budget remains accepted:

```text
Twitch safe compact-rollup projection: 70.99 MB
Kick safe compact-rollup projection:   23.57 MB
Combined safe rollup projection:       94.56 MB
```

Those values are local SQLite schema projections. They do not replace remote D1 size evidence.

## Resume condition

After the two repository secrets become available, rerun:

```text
Analytics 12A2 Remote D1 Size Gate
```

The same workflow will switch from blocked mode to observed mode, collect Wrangler control-plane JSON, remove raw responses, normalize only provider sizes and account aggregate size, and evaluate the storage gate.

No migration, collector runtime change, generation logic, cron change, or retention change is authorized while this record remains the latest remote-size evidence.
