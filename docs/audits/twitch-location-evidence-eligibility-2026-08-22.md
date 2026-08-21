# Twitch Location Evidence Eligibility Audit — 2026-08-22

Status: measured / mergeable contract change

## Scope

This audit closes the bounded A4.1 external-evidence sample that followed the native Twitch Top 300 location-evidence probe.

No production Worker deployment, D1 write, schema change, collector cadence change, retention change, or persistent external-profile acquisition is authorized by this document.

## Measured result

The read-only Top 300 probe observed:

- 300 live streams across three Helix pages.
- 300 matching `/helix/users` records.
- 277 non-empty profile descriptions.
- 1 account-profile candidate stream.
- 0 title candidate streams.
- 2 tag candidate streams.
- 3 streams with any native location candidate: 1.00% candidate yield.
- 0 parser-accepted country placements.
- 0 parser-accepted city placements.
- 297 native-candidate unknown streams.

A bounded manual review of the first 20 native-candidate unknown channels found:

- 1/20 strict `official_external` location that is eligible for placement.
- 5/20 channels that are organization/event-broadcast surfaces rather than a person whose home/current location should be plotted.
- 1/20 person with birthplace evidence only; birthplace is not a home/current placement claim.
- 13/20 with no explicit supported official location evidence accepted in this pass.

The machine-readable record is `docs/audits/twitch-location-external-source-sample-2026-08-22.json`.

## Eligibility boundary

Candidate extraction and map placement are separate stages.

A record is placement-eligible only when all of the following are true:

1. the entity is a person;
2. the claim is `home_base`, `declared_location`, or `current_location`;
3. the evidence source is one of the explicit ViewLoom location evidence sources;
4. the evidence is stronger than `candidate_only`.

The following are retained as context/evidence but do not create a map point:

- birthplace;
- nationality;
- event/tournament venue;
- organization headquarters;
- organization channels;
- event-broadcast channels;
- candidate-only parser matches.

The executable gate and regression cases live in:

- `workers/collector-twitch/scripts/location-placement-eligibility.mjs`
- `workers/collector-twitch/scripts/location-placement-eligibility.test.mjs`

## External acquisition decision

Twitch's supported API exposes the user description, but the public social-links/panels surface is not available through a supported API. The persistent Stream Map acquisition pipeline must not depend on undocumented Twitch internal GraphQL solely to recover those links.

References:

- Twitch Developer Forums: https://discuss.dev.twitch.com/t/how-to-get-user-panel-data-blog-twitter-link/55835
- Twitch Developer Forums: https://discuss.dev.twitch.com/t/adding-streamer-social-media-panel-data-to-the-twitch-api/28786

The 1/20 strict external-location yield does not justify adding a permanent external-profile crawler at this stage. External/manual evidence remains a separate provenance lane and can be revisited after the real-data join exposes its effect on mapped/unmapped coverage.

## Next gate

Proceed to the real Twitch Stream Map join with:

- native candidate evidence kept distinct by source;
- accepted placement gated by entity kind and claim semantics;
- mapped and unmapped counts shown explicitly;
- organization/event-broadcast channels retained in accounting but not silently plotted as a person's home base;
- no language-to-country inference;
- no cross-platform aggregation.
