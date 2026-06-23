import type { HistoryExportDay, HistoryExportModel } from './history-export-model'
import { csvCell } from '../shared/output/csv.js'

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

const HISTORY_CSV_CELL_OPTIONS = {
  quote: 'always',
  spreadsheetSafety: 'apostrophe',
} as const

export function historyExportCsv(model: HistoryExportModel): string {
  const lines = [CSV_COLUMNS.join(',')]
  for (const row of model.daily) {
    lines.push(CSV_COLUMNS.map((column) => csvCell(row[column], HISTORY_CSV_CELL_OPTIONS)).join(','))
  }
  return `${lines.join('\r\n')}\r\n`
}

export function historyExportJson(model: HistoryExportModel): string {
  return `${JSON.stringify(model, null, 2)}\n`
}
