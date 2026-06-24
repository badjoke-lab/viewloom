import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import {
  verifyAdapter,
  verifyEvidence,
} from './watchlist-latest-adapter-cases.mjs'
import { verifyController } from './watchlist-latest-controller-cases.mjs'

const root = process.cwd()
const sourceDir = resolve(root, 'src/live/watchlist')
const sourceFiles = [
  'model.ts',
  'latest-model.ts',
  'latest-adapter.ts',
  'latest-controller.ts',
]
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-watchlist-w2a-'))

try {
  verifyDocuments()
  transpileSources()
  const model = await load('model.js')
  const latestModel = await load('latest-model.js')
  const adapter = await load('latest-adapter.js')
  const controller = await load('latest-controller.js')
  verifyAdapter(adapter)
  verifyEvidence(model, latestModel, adapter)
  await verifyController(model, controller)
  console.log('Watchlist W2A latest verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyDocuments() {
  const spec = readFileSync(resolve(root, '../../docs/product/local-watchlist-spec.md'), 'utf8')
  const plan = readFileSync(resolve(root, '../../docs/product/watchlist-v1-implementation-plan.md'), 'utf8')
  const contract = readFileSync(resolve(root, 'docs/watchlist-latest-w2a-contract.md'), 'utf8')

  for (const fragment of [
    '/api/twitch-heatmap',
    '/api/kick-heatmap',
    'Heatmap requests: exactly 1',
    'no per-channel request loop',
    'Not in latest observed set',
    'Not confirmed offline',
  ]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

  for (const fragment of [
    'work-watchlist-w2a-latest',
    'present_fresh',
    'present_stale',
    'absent_usable',
    'latest_unavailable',
    'concurrent refresh click is deduplicated',
    'No public Watchlist route is added in W2A.',
  ]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)

  for (const fragment of [
    'Status: active Phase 6 W2A contract',
    'viewloom-watchlist-latest-v1',
    'ReadonlyMap',
    'zero valid saved entries -> zero requests',
    'one through fifty saved entries -> exactly one provider request',
    'A request function is injected by the caller.',
  ]) assert.ok(contract.includes(fragment), `contract missing: ${fragment}`)
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')
  const allowedImports = new Set(['./model', './latest-model', './latest-adapter'])

  for (const file of sourceFiles) {
    const sourcePath = resolve(sourceDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    for (const specifier of imports) {
      assert.ok(allowedImports.has(specifier), `${file}: import outside W1/W2A layer: ${specifier}`)
    }

    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file}: global fetch dependency found`)
    for (const forbidden of [
      'globalThis.document',
      'globalThis.window',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'navigator.',
      '/api/history',
      '/api/kick-history',
    ]) assert.equal(source.includes(forbidden), false, `${file}: forbidden dependency found: ${forbidden}`)
    assert.doesNotMatch(source, /(?:functions\/api|\.css['"])/, `${file}: API implementation or style dependency found`)

    const result = ts.transpileModule(source, {
      fileName: sourcePath,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        isolatedModules: true,
      },
    })
    const errors = (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error)
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
  return diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')
}
