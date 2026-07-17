# 12A-4-12 Kick category capture canary post-rollback read-only acceptance

## Status

Accepted and retired.

Final production read-only evidence is frozen at:

- repository: `docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json`
- workflow run: `29488056134`
- workflow job: `87822408236`
- artifact: `8399137444`
- digest: `sha256:070d5de57a141bf3437847070451284e180c908c47de126ff52fda995bc20de1`

## Accepted result

The bounded attempt-3 Kick canary ended and normal collection resumed.

- trigger expired: yes
- canary bindings absent: yes
- direct permanent `CATEGORY_CAPTURE_ENABLED`: absent
- required D1 tables present: yes
- Kick dictionary rows: `164`
- category-bearing snapshots in the bounded window: `288`
- category payload rows after the ten-minute grace boundary: `0`
- provider leakage rows: `0`
- latest normal snapshot after expiry: authenticated and non-empty
- latest normal stream count: `100`
- latest normal total viewers: `239409`
- projected 90-day size: `317.48 MB`
- projected provider headroom: `132.52 MB`
- production mutation by the acceptance probe: no
- Twitch authorization: false

## Recovery chain

The first final probe found only stale expired bindings. PR #586 installed the exact bounded cleanup package, PR #587 triggered the normal Kick configuration redeploy, and PR #588 retired the cleanup path after accepted evidence.

## Retirement

The post-rollback production probe is retired:

- no production probe job;
- no Cloudflare credential references;
- no D1 or Worker production call;
- manual dispatch is validation-only;
- the evidence file and contract are now immutable inputs to the canonical gate.

A Twitch canary is not started or authorized by this acceptance. Any Twitch work requires a separate package, separate review, and separate trigger.
