# 12A-0 evidence method

Status: active method record

The 12A-0 baseline is collected from existing read-only production APIs and repository source contracts. No collector POST route, D1 write, migration, schedule change, or runtime deployment is part of the evidence method.

Provider evidence remains separate. Storage observations come from `/api/data-audit`; source and coverage observations come from `/api/twitch-status` and `/api/kick-status`; daily-rollup availability is checked through provider-specific History windows; query baselines use provider-specific History, Day Flow, and Battle Lines APIs.

The current data model does not preserve true collector wall-clock duration. The evidence records that limitation and a bounded operational proxy instead of inventing a duration measurement.
