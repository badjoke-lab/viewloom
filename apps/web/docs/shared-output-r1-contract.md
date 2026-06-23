# ViewLoom shared output R1 contract

Status: active Phase 4 R1 contract

## Purpose

The shared output layer provides neutral primitives for History and Channel without owning either feature's data model, report wording, schema, DOM, CSS, or request lifecycle.

## Module boundary

```text
src/shared/output/
  provider.ts
  filename.ts
  csv.ts
  values.ts
  clipboard.ts
  download.ts
  result.ts
```

The shared layer may depend only on primitive TypeScript and browser APIs. It must not import History, Channel, route, API, D1, collector, or CSS modules.

## Provider contract

- accepted providers are exactly `twitch` and `kick`;
- display labels are exactly `Twitch` and `Kick`;
- provider detection does not coerce unrelated values.

## Filename contract

- segment input is normalized with Unicode NFKC;
- letters and numbers from Unicode names remain usable;
- unsafe path and control characters are replaced;
- whitespace and unsupported punctuation collapse to hyphens;
- leading and trailing punctuation is removed;
- an empty segment receives an explicit safe fallback;
- extension input is lowercased, stripped of leading dots, and restricted to ASCII letters and numbers;
- feature code remains responsible for selecting and ordering filename segments.

## CSV contract

- `minimal` quoting matches Channel-style syntax: quote only comma, quote, CR, or LF cells;
- `always` quoting supports the accepted History row format;
- embedded quotes are doubled;
- null and undefined values remain explicit blank cells unless a caller supplies another null value;
- spreadsheet formula protection is opt-in through `spreadsheetSafety: 'apostrophe'`;
- formula protection matches the accepted History behavior by checking the value after `trimStart()` and prefixing an apostrophe before the original text;
- R1 does not change History or Channel CSV bytes.

## Numeric contract

- only finite JavaScript numbers are emitted as numbers;
- `finiteNumberOrBlank` returns a decimal string for finite numbers and an empty string otherwise;
- `finiteNumberOrNull` returns the original finite number and `null` otherwise;
- numeric strings are not coerced.

## Clipboard contract

- the Clipboard API path is preferred when supplied;
- Clipboard API rejection returns `clipboard-failed` and does not silently choose feature-visible fallback behavior;
- when no Clipboard API is supplied, an injected textarea/`execCommand('copy')` fallback may be used;
- the fallback textarea is always removed;
- the helper returns a neutral operation result and owns no visible message.

## Download contract

- text download uses an injected or browser Blob/object-URL/temporary-anchor transport;
- filename and MIME type must be non-empty;
- the temporary anchor is removed after activation;
- object URLs are revoked on the caller-selected delay;
- immediate failures revoke any created object URL;
- the helper returns a neutral operation result and owns no visible message.

## Explicit non-goals

R1 does not:

- migrate History or Channel;
- change report or short-post text;
- change CSV headers or row models;
- change JSON schemas or builders;
- change History PNG/share-card behavior;
- change DOM, CSS, action order, labels, or feedback copy;
- add API, D1, binding, collector, cron, retention, or provider-combination behavior.
