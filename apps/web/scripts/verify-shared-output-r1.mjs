import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourceDir = resolve(root, 'src/shared/output')
const contractPath = resolve(root, 'docs/shared-output-r1-contract.md')
const sourceFiles = [
  'result.ts',
  'provider.ts',
  'filename.ts',
  'csv.ts',
  'values.ts',
  'clipboard.ts',
  'download.ts',
]
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-shared-output-r1-'))

try {
  verifyContract()
  transpileSources()
  await verifyRuntimeContracts()
  console.log('Shared output R1 verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyContract() {
  const contract = readFileSync(contractPath, 'utf8')
  for (const fragment of [
    'accepted providers are exactly `twitch` and `kick`',
    '`minimal` quoting matches Channel-style syntax',
    '`always` quoting supports the accepted History row format',
    "spreadsheetSafety: 'apostrophe'",
    'numeric strings are not coerced',
    'Clipboard API rejection returns `clipboard-failed`',
    'object URLs are revoked',
    'R1 does not change History or Channel CSV bytes',
  ]) assert.ok(contract.includes(fragment), `contract missing: ${fragment}`)
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')
  const allowedImports = new Set(sourceFiles.map((file) => `./${file.replace(/\.ts$/, '.js')}`))

  for (const file of sourceFiles) {
    const sourcePath = resolve(sourceDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    for (const specifier of imports) {
      assert.ok(allowedImports.has(specifier), `${file}: shared output imports outside its neutral layer: ${specifier}`)
    }
    assert.doesNotMatch(source, /(?:history|channel|collector|d1|api\/|\.css['"])/i, `${file}: feature or data-layer dependency found`)

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
    assert.equal(errors.length, 0, `${file}: transpile diagnostics: ${formatDiagnostics(errors)}`)
    writeFileSync(join(tempDir, basename(file, '.ts') + '.js'), result.outputText)
  }
}

async function verifyRuntimeContracts() {
  const provider = await load('provider.js')
  const filename = await load('filename.js')
  const csv = await load('csv.js')
  const values = await load('values.js')
  const clipboard = await load('clipboard.js')
  const download = await load('download.js')
  const result = await load('result.js')

  assert.equal(provider.isOutputProvider('twitch'), true)
  assert.equal(provider.isOutputProvider('kick'), true)
  assert.equal(provider.isOutputProvider('youtube'), false)
  assert.equal(provider.providerDisplayName('twitch'), 'Twitch')
  assert.equal(provider.providerDisplayName('kick'), 'Kick')

  assert.equal(filename.sanitizeFilenameSegment('  Café / 東京 Stream  '), 'café-東京-stream')
  assert.equal(filename.sanitizeFilenameSegment('ＡＢＣ'), 'abc')
  assert.equal(filename.sanitizeFilenameSegment('***', 'Fallback Value'), 'fallback-value')
  assert.equal(filename.sanitizeFilenameSegment(undefined), 'unknown')
  assert.equal(
    filename.buildOutputFilename(['ViewLoom', 'Twitch', 'History', '2026-06-24'], '.CSV'),
    'viewloom-twitch-history-2026-06-24.csv',
  )
  assert.throws(() => filename.buildOutputFilename([], 'csv'), /At least one filename segment/)
  assert.throws(() => filename.buildOutputFilename(['viewloom'], '...'), /safe filename extension/)

  assert.equal(csv.csvCell('plain'), 'plain')
  assert.equal(csv.csvCell('a,b'), '"a,b"')
  assert.equal(csv.csvCell('a"b'), '"a""b"')
  assert.equal(csv.csvCell('a\r\nb'), '"a\r\nb"')
  assert.equal(csv.csvCell('plain', { quote: 'always' }), '"plain"')
  assert.equal(csv.csvCell(null, { quote: 'always' }), '')
  assert.equal(
    csv.csvCell('  =SUM(A1:A2)', { quote: 'always', spreadsheetSafety: 'apostrophe' }),
    '"\'  =SUM(A1:A2)"',
  )
  assert.equal(csv.csvCell('+1', { spreadsheetSafety: 'none' }), '+1')
  assert.equal(csv.csvRow(['a,b', 'x']), '"a,b",x')

  assert.equal(values.finiteNumberOrBlank(0), '0')
  assert.equal(values.finiteNumberOrBlank(-12.5), '-12.5')
  assert.equal(values.finiteNumberOrBlank(Number.NaN), '')
  assert.equal(values.finiteNumberOrBlank(Number.POSITIVE_INFINITY), '')
  assert.equal(values.finiteNumberOrBlank('12'), '')
  assert.equal(values.finiteNumberOrNull(0), 0)
  assert.equal(values.finiteNumberOrNull(-12.5), -12.5)
  assert.equal(values.finiteNumberOrNull(Number.NaN), null)
  assert.equal(values.finiteNumberOrNull('12'), null)

  assert.deepEqual(result.outputSuccess(), { ok: true })
  assert.deepEqual(result.outputFailure('invalid-request'), { ok: false, code: 'invalid-request' })

  let apiText = ''
  const apiCopy = await clipboard.writeTextToClipboard('api text', {
    writeText: async (text) => { apiText = text },
  })
  assert.deepEqual(apiCopy, { ok: true })
  assert.equal(apiText, 'api text')

  let fallbackAppended = false
  let fallbackSelected = false
  let fallbackRemoved = false
  let fallbackValue = ''
  const fallbackElement = {
    value: '',
    style: { position: '', opacity: '' },
    select() { fallbackSelected = true },
    remove() { fallbackRemoved = true },
  }
  const fallbackCopy = await clipboard.writeTextToClipboard('fallback text', {
    fallbackDocument: {
      body: {
        append(node) {
          fallbackAppended = node === fallbackElement
          fallbackValue = node.value
        },
      },
      createElement(tagName) {
        assert.equal(tagName, 'textarea')
        return fallbackElement
      },
      execCommand(command) {
        assert.equal(command, 'copy')
        return true
      },
    },
  })
  assert.deepEqual(fallbackCopy, { ok: true })
  assert.equal(fallbackAppended, true)
  assert.equal(fallbackSelected, true)
  assert.equal(fallbackRemoved, true)
  assert.equal(fallbackValue, 'fallback text')
  assert.equal(fallbackElement.style.position, 'fixed')
  assert.equal(fallbackElement.style.opacity, '0')

  let rejectionFallbackUsed = false
  const rejectedCopy = await clipboard.writeTextToClipboard('rejected', {
    writeText: async () => { throw new Error('denied') },
    fallbackDocument: {
      body: { append() { rejectionFallbackUsed = true } },
      createElement() { throw new Error('fallback must not run') },
      execCommand() { return true },
    },
  })
  assert.equal(rejectedCopy.ok, false)
  assert.equal(rejectedCopy.code, 'clipboard-failed')
  assert.equal(rejectionFallbackUsed, false)
  assert.deepEqual(await clipboard.writeTextToClipboard('none', {}), { ok: false, code: 'clipboard-unavailable' })

  const events = []
  const anchor = {
    href: '',
    download: '',
    hidden: false,
    click() { events.push('click') },
    remove() { events.push('remove') },
  }
  const downloaded = download.downloadTextFile({
    name: 'viewloom.csv',
    content: 'a,b\r\n1,2\r\n',
    mimeType: 'text/csv;charset=utf-8',
    revokeDelayMs: 25,
  }, {
    createBlob(content, mimeType) {
      events.push(['blob', content, mimeType])
      return { content, mimeType }
    },
    createObjectURL(blob) {
      events.push(['url', blob])
      return 'blob:viewloom'
    },
    revokeObjectURL(url) { events.push(['revoke', url]) },
    createAnchor() { return anchor },
    appendAnchor(value) {
      assert.equal(value, anchor)
      events.push('append')
    },
    schedule(callback, delayMs) {
      events.push(['schedule', delayMs])
      callback()
    },
  })
  assert.deepEqual(downloaded, { ok: true })
  assert.equal(anchor.href, 'blob:viewloom')
  assert.equal(anchor.download, 'viewloom.csv')
  assert.equal(anchor.hidden, true)
  assert.deepEqual(events.slice(-5), ['append', 'click', 'remove', ['schedule', 25], ['revoke', 'blob:viewloom']])

  assert.deepEqual(
    download.downloadTextFile({ name: '', content: 'x', mimeType: 'text/plain' }, null),
    { ok: false, code: 'invalid-request' },
  )
  assert.deepEqual(
    download.downloadTextFile({ name: 'x.txt', content: 'x', mimeType: 'text/plain' }, null),
    { ok: false, code: 'download-unavailable' },
  )

  let failureRemoved = false
  let failureRevoked = false
  const failedDownload = download.downloadTextFile({
    name: 'x.txt',
    content: 'x',
    mimeType: 'text/plain',
  }, {
    createBlob: () => ({}),
    createObjectURL: () => 'blob:failed',
    revokeObjectURL: () => { failureRevoked = true },
    createAnchor: () => ({
      href: '',
      download: '',
      hidden: false,
      click() { throw new Error('blocked') },
      remove() { failureRemoved = true },
    }),
    appendAnchor: () => {},
    schedule: () => {},
  })
  assert.equal(failedDownload.ok, false)
  assert.equal(failedDownload.code, 'download-failed')
  assert.equal(failureRemoved, true)
  assert.equal(failureRevoked, true)
}

async function load(file) {
  return import(`${pathToFileURL(join(tempDir, file)).href}?v=${Date.now()}-${file}`)
}

function formatDiagnostics(diagnostics) {
  return diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('; ')
}
