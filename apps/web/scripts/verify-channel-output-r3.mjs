import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-channel-output-r3-'))
const contractPath = resolve(root, 'docs/channel-output-r3-contract.md')
const channelReportPath = resolve(root, 'src/live/channel-report.ts')
const sourceFiles = [
  'src/shared/output/csv.ts',
  'src/shared/output/filename.ts',
  'src/shared/output/values.ts',
  'src/live/channel-report.ts',
]

try {
  verifyWrittenContract()
  verifyFeatureOwnedBehavior()
  transpileSources()
  await verifyExactChannelOutputs()
  console.log('Channel output R3 preservation verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyWrittenContract() {
  const contract = readFileSync(contractPath, 'utf8')
  for (const fragment of [
    '`finiteNumberOrBlank`',
    '`finiteNumberOrNull`',
    "quote: 'minimal'",
    "spreadsheetSafety: 'none'",
    'viewloom-channel-v1',
    'CSV UTF-8 BOM at download time',
    'no implicit spreadsheet formula protection',
    'zero-millisecond object-URL revoke timing',
    'exactly one provider History request per loaded period',
  ]) assert.ok(contract.includes(fragment), `R3 contract missing: ${fragment}`)
}

function verifyFeatureOwnedBehavior() {
  const source = readFileSync(channelReportPath, 'utf8')
  for (const fragment of [
    'async function writeClipboard',
    "navigator.clipboard?.writeText",
    "document.createElement('textarea')",
    "document.execCommand('copy')",
    'function downloadFile',
    "document.createElement('a')",
    'anchor.hidden = true',
    'document.body.append(anchor)',
    'anchor.click()',
    'anchor.remove()',
    'window.setTimeout(() => URL.revokeObjectURL(url), 0)',
    "'\\ufeff' + csvOutput(context)",
  ]) assert.ok(source.includes(fragment), `Channel feature-owned behavior changed: ${fragment}`)

  assert.ok(!source.includes('writeTextToClipboard'), 'Channel must not adopt shared clipboard transport in R3')
  assert.ok(!source.includes('downloadTextFile'), 'Channel must not adopt shared download transport in R3')
  assert.ok(!source.includes("spreadsheetSafety: 'apostrophe'"), 'Channel must not add formula protection in R3')
  assert.ok(!/function\s+csvNumber\s*\(/.test(source), 'Local Channel CSV numeric helper must remain replaced')
  assert.ok(!/function\s+nullableNumber\s*\(/.test(source), 'Local Channel nullable-number helper must remain replaced')
  assert.ok(!/function\s+csvCell\s*\(/.test(source), 'Local Channel CSV cell helper must remain replaced')
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
    let output = addJsExtensions(result.outputText)
    if (relativePath === 'src/live/channel-report.ts') {
      output = output.replace(/^import ['"]\.\.\/channel-report\.css['"];?\s*$/m, '')
    }
    writeFileSync(outputPath, output)
  }
}

async function verifyExactChannelOutputs() {
  const payload = channelPayloadFixture()
  const twitchUrl = 'https://vl.badjoke-lab.com/twitch/channel/?id=Alpha&name=Ignored&period=7d&view=report#selected'
  const twitchModule = await loadChannelModule('twitch', twitchUrl, 'twitch')
  const twitchContext = twitchModule.buildContext(payload)

  assert.deepEqual(twitchContext.provider, 'twitch')
  assert.deepEqual(twitchContext.channelId, 'alpha')
  assert.deepEqual(twitchContext.displayName, '=Alpha, "Prime"')
  assert.deepEqual(twitchContext.retained.map((entry) => entry.day.day), ['2026-06-21', '2026-06-20'])
  assert.deepEqual(twitchContext.rivals.map((entry) => entry.day), ['2026-06-21', '2026-06-20'])

  const expectedFull = [
    'ViewLoom · Twitch retained channel footprint',
    'Channel: =Alpha, "Prime" (alpha)',
    'Period: Last 3 days (7d)',
    'Source / state: real / partial',
    'Observed scope: 2 / 3 days',
    'Retained daily Top 10 appearances: 2',
    '',
    'Viewer-minutes: 12,345.5',
    'Peak viewers: 456',
    'Average viewers: 68.5',
    'Observed time: 3h 0m',
    'Newest retained day: 2026-06-21',
    '',
    'Rivalry candidates (daily aggregates):',
    '- 2026-06-21 · Beta vs =Alpha, "Prime" · score 88 · viewer-minute gap 123.5',
    '- 2026-06-20 · Gamma vs =Alpha, "Prime" · score 77 · viewer-minute gap -50',
    '',
    'Limits:',
    "- This output covers ViewLoom's retained provider-specific footprint only.",
    '- Absence from a retained daily Top 10 is not confirmation that the channel was offline.',
    '- Exact session start/end history is not available from this retained footprint.',
    '',
    `Page: ${twitchUrl}`,
  ].join('\n')
  assert.equal(twitchModule.fullSummary(twitchContext), expectedFull)

  const expectedShort = `ViewLoom · Twitch retained footprint for =Alpha, "Prime" (Last 3 days): 2 retained daily Top 10 appearances, 12,345.5 viewer-minutes, retained peak 456 viewers. Data: real/partial. Retained data only; absence does not confirm offline. ${twitchUrl}`
  assert.equal(twitchModule.shortPost(twitchContext), expectedShort)

  const expectedCsv = [
    'provider,channel_id,display_name,period,day,retained_top10,coverage_state,viewer_minutes,peak_viewers,avg_viewers,observed_minutes,rank_by_viewer_minutes',
    'twitch,alpha,"=Alpha, ""Prime""",7d,2026-06-20,true,good,1000,100,50,20,2',
    'twitch,alpha,"=Alpha, ""Prime""",7d,2026-06-21,true,partial,2000.5,200,66.666,30,1',
    'twitch,alpha,"=Alpha, ""Prime""",7d,2026-06-22,false,missing,,,,,',
    '',
  ].join('\r\n')
  assert.equal(twitchModule.csvOutput(twitchContext), expectedCsv)
  assert.ok(!twitchModule.csvOutput(twitchContext).includes("'=Alpha"), 'Channel CSV formula policy changed')

  const expectedJson = {
    schema: 'viewloom-channel-v1',
    provider: 'twitch',
    channel: {
      id: 'alpha',
      display_name: '=Alpha, "Prime"',
      page_url: twitchUrl,
    },
    period: {
      key: '7d',
      label: 'Last 3 days',
      requested_days: 3,
    },
    source: 'real',
    state: 'partial',
    coverage: {
      state: 'partial',
      observedDays: 2,
      missingDays: 1,
      partialDays: 1,
      notes: ['fixture coverage note'],
    },
    summary: {
      viewer_minutes: 12345.5,
      peak_viewers: 456,
      avg_viewers: 68.5,
      observed_minutes: 180,
      retained_top10_days: 2,
      observed_days: 2,
      requested_days: 3,
      newest_retained_day: '2026-06-21',
    },
    daily: [
      {
        day: '2026-06-20',
        retained_top10: true,
        coverage_state: 'good',
        viewer_minutes: 1000,
        peak_viewers: 100,
        avg_viewers: 50,
        observed_minutes: 20,
        rank_by_viewer_minutes: 2,
      },
      {
        day: '2026-06-21',
        retained_top10: true,
        coverage_state: 'partial',
        viewer_minutes: 2000.5,
        peak_viewers: 200,
        avg_viewers: 66.666,
        observed_minutes: 30,
        rank_by_viewer_minutes: 1,
      },
      {
        day: '2026-06-22',
        retained_top10: false,
        coverage_state: 'missing',
        viewer_minutes: null,
        peak_viewers: null,
        avg_viewers: null,
        observed_minutes: null,
        rank_by_viewer_minutes: null,
      },
    ],
    rivalry_candidates: [
      {
        day: '2026-06-21',
        opponent_id: 'beta',
        opponent_name: 'Beta',
        score: 88,
        viewer_minutes_gap: 123.5,
      },
      {
        day: '2026-06-20',
        opponent_id: 'gamma',
        opponent_name: 'Gamma',
        score: 77,
        viewer_minutes_gap: -50,
      },
    ],
    limitations: [
      "This output covers ViewLoom's retained provider-specific footprint only.",
      'Absence from a retained daily Top 10 is not confirmation that the channel was offline.',
      'Exact session start/end history is not available from this retained footprint.',
    ],
  }
  assert.deepEqual(twitchModule.jsonOutput(twitchContext), expectedJson)
  assert.equal(
    `${JSON.stringify(twitchModule.jsonOutput(twitchContext), null, 2)}\n`,
    `${JSON.stringify(expectedJson, null, 2)}\n`,
  )
  assert.equal(twitchModule.filename(twitchContext, 'csv'), 'viewloom-twitch-channel-alpha-7d.csv')

  const kickUrl = 'https://vl.badjoke-lab.com/kick/channel/?id=Alpha&period=7d&view=report#selected'
  const kickModule = await loadChannelModule('kick', kickUrl, 'kick')
  const kickContext = kickModule.buildContext(payload)
  const expectedKickFull = expectedFull
    .replace('Twitch retained channel footprint', 'Kick retained channel footprint')
    .replace(twitchUrl, kickUrl)
  assert.equal(kickModule.fullSummary(kickContext), expectedKickFull)
  assert.equal(kickModule.filename(kickContext, 'json'), 'viewloom-kick-channel-alpha-7d.json')
  assert.equal(kickModule.jsonOutput(kickContext).provider, 'kick')
}

function channelPayloadFixture() {
  const summary = {
    streamerId: 'alpha',
    displayName: '=Alpha, "Prime"',
    viewerMinutes: 12345.5,
    peakViewers: 456,
    avgViewers: 68.5,
    observedMinutes: 180,
    rankByViewerMinutes: 1,
  }
  return {
    source: 'real',
    state: 'partial',
    period: {
      days: 3,
      label: 'Last 3 days',
    },
    coverage: {
      state: 'partial',
      observedDays: 2,
      missingDays: 1,
      partialDays: 1,
      notes: ['fixture coverage note'],
    },
    topStreamers: [summary],
    daily: [
      {
        day: '2026-06-20',
        coverageState: 'good',
        topStreamers: [{
          streamerId: 'alpha',
          displayName: '=Alpha, "Prime"',
          viewerMinutes: 1000,
          peakViewers: 100,
          avgViewers: 50,
          observedMinutes: 20,
          rankByViewerMinutes: 2,
        }],
      },
      {
        day: '2026-06-21',
        coverageState: 'partial',
        topStreamers: [{
          streamerId: 'alpha',
          displayName: '=Alpha, "Prime"',
          viewerMinutes: 2000.5,
          peakViewers: 200,
          avgViewers: 66.666,
          observedMinutes: 30,
          rankByViewerMinutes: 1,
        }],
      },
      {
        day: '2026-06-22',
        coverageState: 'missing',
        topStreamers: [],
      },
    ],
    battleArchive: [
      {
        day: '2026-06-20',
        streamerAId: 'gamma',
        streamerAName: 'Gamma',
        streamerBId: 'alpha',
        streamerBName: '=Alpha, "Prime"',
        score: 77,
        viewerMinutesGap: -50,
      },
      {
        day: '2026-06-21',
        streamerAId: 'alpha',
        streamerAName: '=Alpha, "Prime"',
        streamerBId: 'beta',
        streamerBName: 'Beta',
        score: 88,
        viewerMinutesGap: 123.5,
      },
    ],
  }
}

async function loadChannelModule(provider, href, cacheKey) {
  globalThis.document = {
    body: { dataset: { provider } },
    querySelector: () => null,
    querySelectorAll: () => [],
  }
  globalThis.location = new URL(href)
  globalThis.window = {
    fetch: async () => { throw new Error('Fixture fetch must not run.') },
    setTimeout,
  }
  return import(`${pathToFileURL(join(tempDir, 'live/channel-report.js')).href}?provider=${cacheKey}-${Date.now()}`)
}

function addJsExtensions(output) {
  return output.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, specifier, suffix) => /\.[a-z0-9]+$/i.test(specifier)
      ? match
      : `${prefix}${specifier}.js${suffix}`,
  )
}

function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    .join('; ')
}
