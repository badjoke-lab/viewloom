import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourceDir = resolve(root, 'src/live/watchlist')
const sourceFiles = ['model.ts', 'storage.ts', 'url-state.ts']
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-watchlist-w1-'))

try {
  verifyDocuments()
  transpileSources()
  await verifyRuntime()
  console.log('Watchlist W1 storage verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyDocuments() {
  const spec = readFileSync(resolve(root, '../../docs/product/local-watchlist-spec.md'), 'utf8')
  const plan = readFileSync(resolve(root, '../../docs/product/watchlist-v1-implementation-plan.md'), 'utf8')

  for (const fragment of [
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    'adding an already-saved id does not reorder it',
    'Some invalid saved entries were removed.',
    'Changes cannot be saved in this browser.',
    'No current legacy schema exists.',
    'period=7d|30d',
  ]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

  for (const fragment of [
    'work-watchlist-w1-storage',
    'No public Watchlist route is added in W1.',
    'same-origin cross-tab storage-event handling',
    '50-entry cap',
    'no fetch or DOM dependency in the model/storage layer',
  ]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')

  for (const file of sourceFiles) {
    const sourcePath = resolve(sourceDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    for (const specifier of imports) {
      assert.equal(specifier, './model', `${file}: import outside Watchlist W1 layer: ${specifier}`)
    }

    assert.doesNotMatch(source, /\bfetch\s*\(/, `${file}: network dependency found`)
    assert.doesNotMatch(
      source,
      /\b(?:window|document|localStorage|sessionStorage|indexedDB|navigator)\s*(?:\.|\[)/,
      `${file}: direct browser-global dependency found`,
    )
    assert.doesNotMatch(source, /(?:api\/|\.css['"])/, `${file}: API or style dependency found`)

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

    const output = result.outputText.replace(/from\s+(['"])\.\/model\1/g, "from './model.js'")
    writeFileSync(join(tempDir, basename(file, '.ts') + '.js'), output)
  }
}

async function verifyRuntime() {
  const model = await load('model.js')
  const storage = await load('storage.js')
  const urlState = await load('url-state.js')

  verifyModel(model)
  verifyStorage(model, storage)
  verifyUrlState(urlState)
}

function verifyModel(model) {
  assert.equal(model.WATCHLIST_SCHEMA, 'viewloom-watchlist-v1')
  assert.equal(model.WATCHLIST_REVISION, 1)
  assert.equal(model.WATCHLIST_MAX_ENTRIES, 50)
  assert.equal(model.WATCHLIST_INITIAL_VISIBLE_ENTRIES, 12)

  const validInputs = [
    [' Example_Channel ', 'twitch', 'example_channel'],
    ['https://www.twitch.tv/Example_Channel/?ref=x#top', 'twitch', 'example_channel'],
    ['twitch.tv/example-channel', 'twitch', 'example-channel'],
    ['https://kick.com/Kick_Channel/', 'kick', 'kick_channel'],
  ]
  for (const [input, provider, expected] of validInputs) {
    assert.deepEqual(model.normalizeWatchlistChannelInput(input, provider), { ok: true, channelId: expected })
  }

  for (const input of ['-leading', 'trailing-', 'bad space', 'x'.repeat(65)]) {
    assert.deepEqual(model.normalizeWatchlistChannelInput(input, 'twitch'), { ok: false, code: 'invalid-id' })
  }
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://kick.com/example', 'twitch'),
    { ok: false, code: 'wrong-provider-url' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://example.com/example', 'twitch'),
    { ok: false, code: 'invalid-id' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://www.twitch.tv/a/b', 'twitch'),
    { ok: false, code: 'invalid-id' },
  )

  assert.equal(model.normalizeWatchlistDisplayName('  Example\u0000 Name  ', 'fallback'), 'Example Name')
  assert.equal(model.normalizeWatchlistDisplayName('', 'fallback'), 'fallback')
  assert.equal(Array.from(model.normalizeWatchlistDisplayName('界'.repeat(101))).length, 100)
  assert.throws(() => model.currentIsoTimestamp('bad'), /valid timestamp/)

  const empty = model.createWatchlistDocument('twitch', [], '2026-06-24T00:00:00.000Z')
  const first = model.addWatchlistEntry(empty, 'Example_Channel', 'Example', '2026-06-24T01:00:00.000Z')
  assert.equal(first.ok, true)
  assert.equal(first.document.entries[0].channelId, 'example_channel')
  assert.equal(empty.entries.length, 0)

  const duplicate = model.addWatchlistEntry(first.document, 'example_channel', 'Replacement')
  assert.equal(duplicate.ok, false)
  assert.equal(duplicate.code, 'already-saved')
  assert.equal(duplicate.document.entries[0].displayName, 'Example')

  let full = empty
  for (let index = 0; index < 50; index += 1) {
    const added = model.addWatchlistEntry(
      full,
      `channel_${String(index).padStart(2, '0')}`,
      '',
      new Date(Date.UTC(2026, 5, 24, 2, 0, index)),
    )
    assert.equal(added.ok, true)
    full = added.document
  }
  const overLimit = model.addWatchlistEntry(full, 'channel_50')
  assert.equal(overLimit.ok, false)
  assert.equal(overLimit.code, 'limit-reached')
  assert.equal(overLimit.document, full)

  const ordered = model.createWatchlistDocument('kick', [
    entry('alpha', 'Alpha', '2026-06-24T00:00:00.000Z'),
    entry('beta', 'Beta', '2026-06-24T00:01:00.000Z'),
    entry('gamma', 'Gamma', '2026-06-24T00:02:00.000Z'),
  ], '2026-06-24T00:03:00.000Z')
  const moved = model.moveWatchlistEntry(ordered, 'beta', 'up', '2026-06-24T04:00:00.000Z')
  assert.equal(moved.ok, true)
  assert.deepEqual(moved.document.entries.map((item) => item.channelId), ['beta', 'alpha', 'gamma'])
  assert.deepEqual(ordered.entries.map((item) => item.channelId), ['alpha', 'beta', 'gamma'])

  const edge = model.moveWatchlistEntry(ordered, 'alpha', 'up')
  assert.equal(edge.ok, true)
  assert.equal(edge.changed, false)
  assert.equal(edge.document, ordered)

  const removed = model.removeWatchlistEntry(ordered, 'beta', '2026-06-24T05:00:00.000Z')
  assert.equal(removed.ok, true)
  assert.deepEqual(removed.document.entries.map((item) => item.channelId), ['alpha', 'gamma'])
  assert.equal(model.removeWatchlistEntry(ordered, 'missing').code, 'not-found')
  assert.equal(model.clearWatchlistDocument(ordered).document.entries.length, 0)
}

function verifyStorage(model, storage) {
  assert.equal(storage.watchlistStorageKey('twitch'), 'viewloom.watchlist.twitch.v1')
  assert.equal(storage.watchlistStorageKey('kick'), 'viewloom.watchlist.kick.v1')

  const memory = createMemoryStorage()
  const missing = storage.readWatchlistStorage(memory.api, 'twitch', '2026-06-24T00:00:00.000Z')
  assert.equal(missing.ok, true)
  assert.equal(missing.state, 'empty')
  assert.equal(memory.calls.set, 0)

  const stored = storage.addStoredWatchlistEntry(
    memory.api,
    missing.document,
    'Example_Channel',
    'Example',
    '2026-06-24T01:00:00.000Z',
  )
  assert.equal(stored.ok, true)
  assert.equal(memory.calls.set, 1)
  assert.equal(memory.values.has('viewloom.watchlist.kick.v1'), false)

  const reread = storage.readWatchlistStorage(memory.api, 'twitch')
  assert.equal(reread.ok, true)
  assert.equal(reread.state, 'ready')
  assert.equal(reread.document.entries[0].channelId, 'example_channel')

  const setsBeforeDuplicate = memory.calls.set
  const duplicate = storage.addStoredWatchlistEntry(memory.api, reread.document, 'example_channel', 'Other')
  assert.equal(duplicate.ok, false)
  assert.equal(duplicate.code, 'already-saved')
  assert.equal(memory.calls.set, setsBeforeDuplicate)

  const writeFailure = createMemoryStorage({ throwOnSet: true })
  const failedWrite = storage.addStoredWatchlistEntry(writeFailure.api, missing.document, 'new_channel')
  assert.equal(failedWrite.ok, false)
  assert.equal(failedWrite.code, 'write-failed')
  assert.deepEqual(failedWrite.document, missing.document)

  const unavailable = storage.readWatchlistStorage(createMemoryStorage({ throwOnGet: true }).api, 'kick')
  assert.deepEqual(unavailable, {
    ok: false,
    state: 'unavailable',
    code: 'storage-unavailable',
    repaired: false,
    persisted: false,
  })

  const corrupt = createMemoryStorage()
  corrupt.values.set('viewloom.watchlist.twitch.v1', '{bad')
  const corrupted = storage.readWatchlistStorage(corrupt.api, 'twitch')
  assert.equal(corrupted.ok, false)
  assert.equal(corrupted.state, 'corrupted')
  assert.equal(corrupt.calls.set, 0)
  assert.equal(corrupt.values.get('viewloom.watchlist.twitch.v1'), '{bad')

  const repairedMemory = createMemoryStorage()
  const repairEntries = [
    entry('UPPER_CASE', '  Upper\u0000 Case  ', '2026-06-24T00:00:00.000Z'),
    entry('upper_case', 'Duplicate', '2026-06-24T00:01:00.000Z'),
    entry('invalid!', 'Invalid', '2026-06-24T00:02:00.000Z'),
    ...Array.from({ length: 51 }, (_, index) => entry(
      `valid_${String(index).padStart(2, '0')}`,
      `Valid ${index}`,
      new Date(Date.UTC(2026, 5, 24, 1, 0, index)).toISOString(),
    )),
  ]
  repairedMemory.values.set('viewloom.watchlist.twitch.v1', JSON.stringify({
    schema: 'viewloom-watchlist-v1',
    provider: 'twitch',
    revision: 1,
    updatedAt: '2026-06-24T02:00:00.000Z',
    entries: repairEntries,
  }))
  const repaired = storage.readWatchlistStorage(repairedMemory.api, 'twitch')
  assert.equal(repaired.ok, true)
  assert.equal(repaired.state, 'repaired')
  assert.equal(repaired.document.entries.length, 50)
  assert.equal(repaired.document.entries[0].channelId, 'upper_case')
  assert.equal(repaired.document.entries[0].displayName, 'Upper Case')
  assert.equal(repairedMemory.calls.set, 1)

  const repairWriteFailure = createMemoryStorage({ throwOnSet: true })
  repairWriteFailure.values.set('viewloom.watchlist.twitch.v1', JSON.stringify({
    schema: 'viewloom-watchlist-v1',
    provider: 'twitch',
    revision: 1,
    updatedAt: '2026-06-24T02:00:00.000Z',
    entries: [entry('UPPER', 'Upper', '2026-06-24T00:00:00.000Z')],
  }))
  const usableRepair = storage.readWatchlistStorage(repairWriteFailure.api, 'twitch')
  assert.equal(usableRepair.ok, true)
  assert.equal(usableRepair.state, 'write_error')
  assert.equal(usableRepair.document.entries[0].channelId, 'upper')

  assert.deepEqual(storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.kick.v1',
    newValue: null,
  }), { matched: false })
  const clearEvent = storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.twitch.v1',
    newValue: null,
  }, '2026-06-24T05:00:00.000Z')
  assert.equal(clearEvent.matched, true)
  assert.equal(clearEvent.result.state, 'empty')
  const corruptEvent = storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.twitch.v1',
    newValue: '{bad',
  })
  assert.equal(corruptEvent.matched, true)
  assert.equal(corruptEvent.result.state, 'corrupted')

  const ordered = model.createWatchlistDocument('twitch', [
    entry('alpha', 'Alpha', '2026-06-24T00:00:00.000Z'),
    entry('beta', 'Beta', '2026-06-24T00:01:00.000Z'),
  ], '2026-06-24T00:02:00.000Z')
  const clearMemory = createMemoryStorage()
  clearMemory.values.set('viewloom.watchlist.twitch.v1', 'twitch-data')
  clearMemory.values.set('viewloom.watchlist.kick.v1', 'kick-data')
  assert.equal(storage.clearStoredWatchlist(clearMemory.api, ordered, false).code, 'confirmation-required')
  const cleared = storage.clearStoredWatchlist(clearMemory.api, ordered, true, '2026-06-24T06:00:00.000Z')
  assert.equal(cleared.ok, true)
  assert.equal(clearMemory.values.has('viewloom.watchlist.twitch.v1'), false)
  assert.equal(clearMemory.values.get('viewloom.watchlist.kick.v1'), 'kick-data')

  const resetMemory = createMemoryStorage()
  resetMemory.values.set('viewloom.watchlist.kick.v1', '{bad')
  assert.equal(storage.resetStoredWatchlist(resetMemory.api, 'kick', false).code, 'confirmation-required')
  assert.equal(storage.resetStoredWatchlist(resetMemory.api, 'kick', true).ok, true)
  assert.equal(resetMemory.values.has('viewloom.watchlist.kick.v1'), false)
}

function verifyUrlState(urlState) {
  assert.deepEqual(
    urlState.parseWatchlistUrlState(new URL('https://vl.example/twitch/watchlist/'), 'twitch'),
    { provider: 'twitch', period: '30d' },
  )
  assert.deepEqual(
    urlState.parseWatchlistUrlState(new URL('https://vl.example/kick/watchlist/?period=7d'), 'kick'),
    { provider: 'kick', period: '7d' },
  )
  assert.deepEqual(
    urlState.parseWatchlistUrlState(new URL('https://vl.example/kick/watchlist/?period=90d'), 'kick'),
    { provider: 'kick', period: '30d' },
  )

  const sevenDay = urlState.watchlistStateUrl(
    new URL('https://vl.example/twitch/watchlist/?id=secret&filter=name&utm_source=test#saved'),
    { provider: 'twitch', period: '7d' },
  )
  assert.equal(sevenDay, '/twitch/watchlist/?utm_source=test&period=7d#saved')
  assert.equal(sevenDay.includes('secret'), false)
  assert.equal(sevenDay.includes('filter='), false)

  const cleanDefault = urlState.watchlistStateUrl(
    new URL('https://vl.example/twitch/watchlist/?period=7d'),
    { provider: 'twitch', period: '30d' },
  )
  assert.equal(cleanDefault, '/twitch/watchlist/')

  const forward = urlState.parseWatchlistUrlState(new URL(`https://vl.example${sevenDay}`), 'twitch')
  const back = urlState.parseWatchlistUrlState(new URL('https://vl.example/twitch/watchlist/'), 'twitch')
  assert.equal(forward.period, '7d')
  assert.equal(back.period, '30d')
  assert.equal(urlState.sameWatchlistHistoryScope(forward, back), false)
  assert.equal(urlState.sameWatchlistHistoryScope(forward, { ...forward }), true)
  assert.equal(urlState.sameWatchlistHistoryScope(forward, { provider: 'kick', period: '7d' }), false)
}

function entry(channelId, displayName, addedAt) {
  return { channelId, displayName, addedAt }
}

function createMemoryStorage(options = {}) {
  const values = new Map()
  const calls = { get: 0, set: 0, remove: 0 }
  return {
    values,
    calls,
    api: {
      getItem(key) {
        calls.get += 1
        if (options.throwOnGet) throw new Error('read denied')
        return values.has(key) ? values.get(key) : null
      },
      setItem(key, value) {
        calls.set += 1
        if (options.throwOnSet) throw new Error('write denied')
        values.set(key, value)
      },
      removeItem(key) {
        calls.remove += 1
        if (options.throwOnRemove) throw new Error('remove denied')
        values.delete(key)
      },
    },
  }
}

async function load(file) {
  return import(`${pathToFileURL(join(tempDir, file)).href}?v=${Date.now()}-${file}`)
}

function formatDiagnostics(diagnostics) {
  return diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('; ')
}
