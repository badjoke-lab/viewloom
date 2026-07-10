# 12A-0 capacity baseline evidence package

This directory currently contains the active 12A-0 evidence contract:

```text
12a0-capacity-baseline-contract.json
```

The accepted production artifact will be frozen after the dedicated GitHub Actions baseline run passes:

```text
12a0-current-data-capacity-baseline.json
```

Until that file exists and passes `scripts/verify-12a0-capacity-baseline-evidence.mjs`, 12A-0 remains active and 12A-1 must not start.
