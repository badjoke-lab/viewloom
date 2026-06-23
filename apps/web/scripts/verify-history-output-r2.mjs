import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-history-output-r2-'))
const contractPath = resolve(root, 'docs/history-output-r2-contract.md')
const reportRenderPath = resolve(root, 'src/live/history-report-text-render.ts')
const exportRenderPath = resolve(root, 'src/live/history-export.ts')
const sourceFiles = [
  'src/shared/output/values.ts',
  'src/shared/output/csv.ts',
  'src/shared/output/filename.ts',
  'src/live/history-report-text-state.ts',
  'src/live/history-export-model.ts',
  'src/live/history-export-serialize.ts',
  'src/live/history-export.ts',
]

try {
  verifyWrittenContract()
  verifyDeferredFeatureBehavior()
  transpileSources()
  await verifyExactHistoryOutputs()
  console.log('History output R2 preservation verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyWrittenContract() {
  const contract = readFileSync(contractPath, 'utf8')
  for (const fragment of [
    '`finiteNumberOrNull`',
    "quote: 'always'",
    "spreadsheetSafety: 'apostrophe'",
    'viewloom-history-export-v1',
    'CSV CRLF line endings',
    '1000 ms object-URL revoke delay',
    'report copy fallback behavior',
    'provider History request count',
  ]) assert.ok(contract.includes(fragment), `R2 contract missing: ${fragment}`)
}

function verifyDeferredFeatureBehavior() {
  const exportSource = readFileSync(exportRenderPath, 'utf8')
  const reportSource = readFileSync(reportRenderPath, 'utf8')

  for (const fragment of [
    "document.createElement('a')",
    'document.body.append(anchor)',
    'anchor.click()',
    'anchor.remove()',
    'window.setTimeout(() => URL.revokeObjectURL(url), 1000)',
    "status.textContent = success",
  ]) assert.ok(exportSource.includes(fragment), `History download behavior changed: ${fragment}`)

  assert.ok(!exportSource.includes('downloadTextFile('), 'History must not adopt shared download transport in R2')
  assert.ok(!reportSource.includes('writeTextToClipboard'), 'History must not adopt shared clipboard transport in R2')
  assert.ok(reportSource.includes('navigator.clipboard?.writeText'), 'History Clipboard API path changed')
  assert.ok(reportSource.includes('selectPreview(preview)'), 'History visible-preview copy fallback changed')
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')

  for (const relativePath of sourceFiles) {
    const sourcePath = resolve(root, relativePath)
    const source = readFileSync(sourcePath, 'utf8')
    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        isolatedModules: true,
      },
    })
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    assert.equal(errors.length, 0, `${relativePath}: ${formatDiagnostics(errors)}`)

    const outputPath = join(tempDir, relativePath.replace(/^src\//, '').replace(/\.ts$/, '.js'))
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, addJsExtensions(result.outputText))
  }
}

async function verifyExactHistoryOutputs() {
  const reportState = await load('live/history-report-text-state.js')
  const modelModule = await load('live/history-export-model.js')
  const serializeModule = await load('live/history-export-serialize.js')
  const exportModule = await load('live/history-export.js')

  const payload = {
    source: 'real',
    state: 'partial',
    metric: 'peak_viewers',
    period: {
      from: '2026-06-20',
      to: '2026-06-22',
      label: 'Last three days',
      days: 3,
    },
    summary: {
      totalViewerMinutes: 12345.6,
      peakViewers: 321,
      peakDay: '2026-06-21',
      coverageState: 'partial',
      topStreamer: {
        displayName: 'Alpha',
        viewerMinutes: 9000,
        peakViewers: 321,
      },
      biggestRise: {
        displayName: 'Beta',
        changePct: 12.34,
      },
    },
    daily: [
      {
        day: '2026-06-20',
        coverageState: 'good',
        totalViewerMinutes: 1000,
        peakViewers: 100,
        peakStreamerName: '  =Alpha',
        observedStreamCount: 10,
        observedMinutes: 120,
      },
      {
        day: '2026-06-22',
        coverageState: 'missing',
        totalViewerMinutes: 999999,
        peakViewers: 999999,
        peakStreamerName: 'Ignored',
        observedStreamCount: 999,
        observedMinutes: 999,
      },
    ],
    topStreamers: [
      {
        streamerId: 'alpha',
        displayName: 'Alpha',
        viewerMinutes: 9000,
        peakViewers: 321,
        observedMinutes: 180,
      },
      {
        streamerId: 'beta',
        displayName: ' Beta\nName ',
        viewerMinutes: Number.NaN,
        peakViewers: Number.POSITIVE_INFINITY,
        observedMinutes: 0,
      },
    ],
    coverage: {
      state: 'partial',
      observedDays: 1,
      missingDays: 2,
      partialDays: 0,
    },
  }

  const currentUrl = 'https://vl.badjoke-lab.com/twitch/history/?period=30d#selected'
  const model = modelModule.historyExportModel(payload, 'twitch', currentUrl)
  const expectedModel = {
    schema: 'viewloom-history-export-v1',
    project: 'ViewLoom',
    provider: 'twitch',
    view_url: 'https://vl.badjoke-lab.com/twitch/history/?period=30d',
    period: {
      from: '2026-06-20',
      to: '2026-06-22',
      label: 'Last three days',
      days: 3,
    },
    metric: 'peak_viewers',
    source: 'real',
    state: 'partial',
    coverage: {
      total_days: 3,
      observed_days: 1,
      missing_days: 2,
      attention_days: 0,
    },
    daily: [
      {
        provider: 'twitch',
        day: '2026-06-20',
        coverage_state: 'good',
        viewer_minutes: 1000,
        peak_viewers: 100,
        peak_streamer: '=Alpha',
        observed_stream_count: 10,
        observed_minutes: 120,
      },
      {
        provider: 'twitch',
        day: '2026-06-21',
        coverage_state: 'missing',
        viewer_minutes: null,
        peak_viewers: null,
        peak_streamer: null,
        observed_stream_count: null,
        observed_minutes: null,
      },
      {
        provider: 'twitch',
        day: '2026-06-22',
        coverage_state: 'missing',
        viewer_minutes: null,
        peak_viewers: null,
        peak_streamer: null,
        observed_stream_count: null,
        observed_minutes: null,
      },
    ],
    top_streamers: [
      {
        streamer_id: 'alpha',
        display_name: 'Alpha',
        viewer_minutes: 9000,
        peak_viewers: 321,
        observed_minutes: 180,
      },
      {
        streamer_id: 'beta',
        display_name: 'Beta Name',
        viewer_minutes: null,
        peak_viewers: null,
        observed_minutes: 0,
      },
    ],
    limitation: 'Observed ViewLoom data; not a provider-wide total.',
  }
  assert.deepEqual(model, expectedModel)

  const expectedCsv = [
    'provider,day,coverage_state,viewer_minutes,peak_viewers,peak_streamer,observed_stream_count,observed_minutes',
    `"twitch","2026-06-20","good","1000","100","'=Alpha","10","120"`,
    '"twitch","2026-06-21","missing",,,,,',
    '"twitch","2026-06-22","missing",,,,,',
    '',
  ].join('\r\n')
  assert.equal(serializeModule.historyExportCsv(model), expectedCsv)
  assert.equal(serializeModule.historyExportJson(model), `${JSON.stringify(expectedModel, null, 2)}\n`)

  const expectedTwitchReport = [
    'ViewLoom — Twitch History & Trends',
    'Jun 20, 2026 – Jun 22, 2026 (UTC)',
    'Metric: Peak viewers',
    'Observed days: 1 of 3 · 2 missing',
    'Total observed: 12,346 viewer-minutes',
    'Peak: 321 viewers on Jun 21, 2026',
    'Top streamer: Alpha — 9,000 viewer-minutes',
    'Biggest rise: Beta (+12.3%)',
    'Data state: Partial · Source: Real observed data',
    'Coverage note: observed ViewLoom data; not a provider-wide total.',
    'https://vl.badjoke-lab.com/twitch/history/?period=30d',
  ].join('\n')
  assert.equal(reportState.historyReportText(payload, 'twitch', currentUrl), expectedTwitchReport)

  const expectedKickReport = expectedTwitchReport
    .replace('ViewLoom — Twitch History & Trends', 'ViewLoom — Kick History & Trends')
    .replace('/twitch/history/', '/kick/history/')
  assert.equal(reportState.historyReportText(payload, 'kick', currentUrl), expectedKickReport)

  assert.equal(
    exportModule.historyExportFilename('twitch', '2026-06-20', '2026-06-22', 'csv'),
    'viewloom-twitch-history-2026-06-20-2026-06-22.csv',
  )
  assert.equal(
    exportModule.historyExportFilename('kick', '2026-06-20', '2026-06-22', 'json'),
    'viewloom-kick-history-2026-06-20-2026-06-22.json',
  )
}

function addJsExtensions(output) {
  return output.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, specifier, suffix) => /\.[a-z0-9]+$/i.test(specifier)
      ? match
      : `${prefix}${specifier}.js${suffix}`,
  )
}

async function load(relativePath) {
  return import(`${pathToFileURL(join(tempDir, relativePath)).href}?v=${Date.now()}-${relativePath}`)
}

function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    .join('; ')
}
