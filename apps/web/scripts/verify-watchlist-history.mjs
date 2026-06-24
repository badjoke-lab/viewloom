import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { verifyHistoryAdapterCore } from './watchlist-history-adapter-core-cases.mjs'
import { verifyHistoryAdapterErrors } from './watchlist-history-adapter-error-cases.mjs'
import { verifyRetainedEvidence } from './watchlist-history-evidence-cases.mjs'
import { verifyHistoryControllerCore } from './watchlist-history-controller-core-cases.mjs'
import { verifyHistoryControllerErrors } from './watchlist-history-controller-error-cases.mjs'
import { verifyCombinedModel } from './watchlist-combined-model-cases.mjs'
import { verifyCombinedControllerCore } from './watchlist-combined-controller-core-cases.mjs'
import { verifyCombinedControllerErrors } from './watchlist-combined-controller-error-cases.mjs'

const root = process.cwd()
const sourceDir = resolve(root, 'src/live/watchlist')
const sourceFiles = [
  'model.ts',
  'latest-model.ts',
  'latest-adapter.ts',
  'latest-controller.ts',
  'history-model.ts',
  'history-adapter.ts',
  'history-controller.ts',
  'combined-model.ts',
  'combined-controller.ts',
]
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-watchlist-w2b-'))

try {
  verifyDocuments()
  transpileSources()
  const model = await load('model.js')
  const latestModel = await load('latest-model.js')
  const latestAdapter = await load('latest-adapter.js')
  const historyModel = await load('history-model.js')
  const historyAdapter = await load('history-adapter.js')
  const historyController = await load('history-controller.js')
  const combinedModel = await load('combined-model.js')
  const combinedController = await load('combined-controller.js')

  verifyHistoryAdapterCore(historyAdapter)
  verifyHistoryAdapterErrors(historyAdapter)
  verifyRetainedEvidence(model, historyModel, historyAdapter)
  await verifyHistoryControllerCore(historyController)
  await verifyHistoryControllerErrors(historyController)
  verifyCombinedModel(
    combinedModel,
    latestAdapter,
    latestModel,
    historyAdapter,
    historyModel,
  )
  await verifyCombinedControllerCore(combinedController)
  await verifyCombinedControllerErrors(combinedController)
  console.log('Watchlist W2B History verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyDocuments() {
  const spec = readFileSync(
    resolve(root, '../../docs/product/local-watchlist-spec.md'),
    'utf8',
  )
  const plan = readFileSync(
    resolve(root, '../../docs/product/watchlist-v1-implementation-plan.md'),
    'utf8',
  )
  const contract = readFileSync(
    resolve(root, 'docs/watchlist-history-w2b-contract.md'),
    'utf8',
  )

  for (const fragment of [
    '/api/history?period=<7d|30d>&metric=viewer_minutes',
    '/api/kick-history?period=<7d|30d>&metric=viewer_minutes',
    'period change performs exactly one new provider History request',
    'no per-channel request loop',
    'No complete history is implied',
  ]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

  for (const fragment of [
    'work-watchlist-w2b-history',
    'present_retained',
    'history_partial',
    'history_unavailable',
    'Back/Forward period restore',
    'No public Watchlist route is added in W2B.',
  ]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)

  for (const fragment of [
    'Status: active Phase 6 W2B contract',
    'viewloom-watchlist-history-v1',
    'period restore from page memory',
    '1 Heatmap + 1 History',
    'latest failure must not remove retained evidence',
    'request functions are injected by the caller',
  ]) assert.ok(contract.includes(fragment), `contract missing: ${fragment}`)
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')
  const allowedImports = new Set([
    './model',
    './latest-model',
    './latest-adapter',
    './latest-controller',
    './history-model',
    './history-adapter',
    './history-controller',
    './combined-model',
  ])

  for (const file of sourceFiles) {
    const sourcePath = resolve(sourceDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]
      .map((match) => match[1])
    for (const specifier of imports) {
      assert.ok(
        allowedImports.has(specifier),
        `${file}: import outside Watchlist model layer: ${specifier}`,
      )
    }

    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file}: global fetch dependency found`)
    for (const forbidden of [
      'globalThis.document',
      'globalThis.window',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'navigator.',
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${file}: forbidden browser dependency found: ${forbidden}`,
      )
    }
    assert.doesNotMatch(
      source,
      /(?:functions\/api|\.css['"])/,
      `${file}: API implementation or style dependency found`,
    )

    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        isolatedModules: true,
      },
    })
    const errors = (result.diagnostics ?? [])
      .filter((item) => item.category === ts.DiagnosticCategory.Error)
    assert.equal(errors.length, 0, `${file}: ${formatDiagnostics(errors)}`)

    let output = result.outputText
    for (const specifier of allowedImports) {
      output = output
        .replaceAll(`from '${specifier}'`, `from '${specifier}.js'`)
        .replaceAll(`from "${specifier}"`, `from "${specifier}.js"`)
    }
    writeFileSync(join(tempDir, basename(file, '.ts') + '.js'), output)
  }
}

async function load(file) {
  return import(`${pathToFileURL(join(tempDir, file)).href}?v=${Date.now()}-${file}`)
}

function formatDiagnostics(diagnostics) {
  return diagnostics
    .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))
    .join('; ')
}
