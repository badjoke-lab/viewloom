import type { HistoryExportDay, HistoryExportModel } from './history-export-model'

const CSV_COLUMNS = [
  'provider',
  'day',
  'coverage_state',
  'viewer_minutes',
  'peak_viewers',
  'peak_streamer',
  'observed_stream_count',
  'observed_minutes',
] as const satisfies ReadonlyArray<keyof HistoryExportDay>

export function historyExportCsv(model: HistoryExportModel): string {
  const lines = [CSV_COLUMNS.join(',')]
  for (const row of model.daily) {
    lines.push(CSV_COLUMNS.map((column) => csvCell(row[column])).join(','))
  }
  return `${lines.join('\r\n')}\r\n`
}

export function historyExportJson(model: HistoryExportModel): string {
  return `${JSON.stringify(model, null, 2)}\n`
}

function csvCell(value: string | number | null): string {
  if (value === null) return ''
  const raw = typeof value === 'number' ? String(value) : safeSpreadsheetText(value)
  return `"${raw.replace(/"/g, '""')}"`
}

function safeSpreadsheetText(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value
}
