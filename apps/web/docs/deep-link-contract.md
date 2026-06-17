# ViewLoom Feature Deep-Link Contract

## Purpose

Day Flow and Battle Lines preserve the current analysis view in the page URL. Reloading or sharing that URL must keep the provider route and restore only supported state.

## Day Flow parameters

Stable order:

```text
metric, scope, top, bucket, rangeMode, date, time, streamer, auto
```

Allowed values:

- `metric`: `volume` or `share`
- `scope`: `full` or `topFocus`
- `top`: `10`, `20`, or `50`
- `bucket`: `5` or `10`
- `rangeMode`: `today`, `rolling24h`, `yesterday`, or `date`
- `date`: valid UTC date
- `time`: valid instant
- `streamer`: safe observed identifier
- `auto`: `on` or `off`

## Battle Lines parameters

Stable order:

```text
metric, top, bucket, range, date, battle, stream, time
```

Allowed values:

- `metric`: `viewers` or `indexed`
- `top`: `3`, `5`, or `10`
- `bucket`: `5m` or `10m`
- `range`: `today`, `yesterday`, or `date`
- `date`: valid UTC date
- `battle`: safe observed battle identifier
- `stream`: safe observed stream identifier
- `time`: valid instant

`point` is retained only as a legacy read parameter. New generated links do not emit array indexes because the same numeric index may refer to a different instant after the bucket or observed window changes.

## Rules

- Unknown parameters are dropped from generated links.
- Invalid values are dropped rather than guessed.
- Parameter order is deterministic.
- Provider path is preserved.
- Query state never changes canonical metadata.
- Selected time uses an absolute instant in newly generated Battle Lines links.
