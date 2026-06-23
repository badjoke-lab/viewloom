export type CsvQuoteMode = 'minimal' | 'always'
export type CsvSpreadsheetSafety = 'none' | 'apostrophe'

export type CsvCellOptions = {
  quote?: CsvQuoteMode
  spreadsheetSafety?: CsvSpreadsheetSafety
  nullValue?: string
}

export function csvCell(value: unknown, options: CsvCellOptions = {}): string {
  if (value === null || value === undefined) return options.nullValue ?? ''

  const raw = String(value)
  const safe = options.spreadsheetSafety === 'apostrophe' && typeof value === 'string'
    ? spreadsheetSafeText(raw)
    : raw
  const quote = options.quote ?? 'minimal'

  return quote === 'always' || /[",\r\n]/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe
}

export function csvRow(values: readonly unknown[], options: CsvCellOptions = {}): string {
  return values.map((value) => csvCell(value, options)).join(',')
}

export function spreadsheetSafeText(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value
}
