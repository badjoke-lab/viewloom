# Kick coverage UI contract

The Kick Home, Status, Heatmap, Day Flow, Battle Lines, and History pages use the same source labels and observed-limit language.

## Source labels

```text
official-livestreams      -> Official endpoint
registry                  -> Registry candidates
seed-list                 -> Seed list
public-channel-fallback   -> Candidate fallback
fixture / demo            -> Fixture
```

## Existing display surfaces

- Home: coverage, source, and status note
- Status: source fact and coverage cell
- Heatmap: existing data-truth Source and Top 100 coverage cells
- Day Flow: existing coverage row and Source cell
- Battle Lines: existing Coverage & limits section
- History: existing Coverage & data quality section and Source cell

No additional API request is made. The UI observer reads a clone of the feature response already requested by the page. Twitch routes are not observed by the Kick UI synchronizer.
