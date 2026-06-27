// Dedicated P9H5 runner; changes here intentionally retrigger the required-width gate.
const RealDate = globalThis.Date
const fixedNow = new RealDate('2026-06-25T00:00:00.000Z').getTime()

globalThis.Date = class FixedHistoryDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : [fixedNow]))
  }

  static now() {
    return fixedNow
  }
}

try {
  await import('./history-ui-h5-responsive-browser.mjs')
} finally {
  globalThis.Date = RealDate
}
