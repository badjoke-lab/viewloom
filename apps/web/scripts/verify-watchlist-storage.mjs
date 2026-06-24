import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = process.cwd()
const sourceDir = resolve(root, 'src/live/watchlist')
const specPath = resolve(root, '../../docs/product/local-watchlist-spec.md')
const planPath = resolve(root, '../../docs/product/watchlist-v1-implementation-plan.md')
const sourceFiles = ['model.ts', 'storage.ts', 'url-state.ts']
const tempDir = mkdtempSync(join(tmpdir(), 'viewloom-watchlist-w1-'))

try {
  verifyPermanentContracts()
  transpileSources()
  await verifyRuntimeContracts()
  console.log('Watchlist W1 storage verification passed.')
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

function verifyPermanentContracts() {
  const spec = readFileSync(specPath, 'utf8')
  const plan = readFileSync(planPath, 'utf8')

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
    'storage/model layer has no fetch or DOM dependency',
    'cross-tab `storage` event handling',
    'fifty-first unique entry is rejected without mutation',
  ]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)
}

function transpileSources() {
  writeFileSync(join(tempDir, 'package.json'), '{"type":"module"}\n')
  const allowedImports = new Set(['./model'])

  for (const file of sourceFiles) {
    const sourcePath = resolve(sourceDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    for (const specifier of imports) {
      assert.ok(allowedImports.has(specifier), `${file}: import outside Watchlist W1 layer: ${specifier}`)
    }

    assert.doesNotMatch(
      source,
      /\b(?:fetch|document|window|localStorage|sessionStorage|indexedDB|navigator)\b|(?:api\/|\.css['"])/,
      `${file}: browser, network, style, or API dependency found`,
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
    const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    assert.equal(errors.length, 0, `${file}: transpile diagnostics: ${formatDiagnostics(errors)}`)

    const output = result.outputText.replace(
      /from\s+(['"])\.\/model\1/g,
      "from './model.js'",
    )
    writeFileSync(join(tempDir, basename(file, '.ts') + '.js'), output)
  }
}

async function verifyRuntimeContracts() {
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
  assert.equal(model.isWatchlistProvider('twitch'), true)
  assert.equal(model.isWatchlistProvider('kick'), true)
  assert.equal(model.isWatchlistProvider('youtube'), false)
  assert.equal(model.isWatchlistPeriod('7d'), true)
  assert.equal(model.isWatchlistPeriod('30d'), true)
  assert.equal(model.isWatchlistPeriod('90d'), false)

  assert.deepEqual(model.normalizeWatchlistChannelInput(' Example_Channel ', 'twitch'), {
    ok: true,
    channelId: 'example_channel',
  })
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://www.twitch.tv/Example_Channel/?ref=x#top', 'twitch'),
    { ok: true, channelId: 'example_channel' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('twitch.tv/example-channel', 'twitch'),
    { ok: true, channelId: 'example-channel' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://kick.com/example-channel', 'twitch'),
    { ok: false, code: 'wrong-provider-url' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://example.com/example-channel', 'twitch'),
    { ok: false, code: 'invalid-id' },
  )
  assert.deepEqual(
    model.normalizeWatchlistChannelInput('https://www.twitch.tv/a/b', 'twitch'),
    { ok: false, code: 'invalid-id' },
  )
  assert.deepEqual(model.normalizeWatchlistChannelInput('-leading', 'twitch'), { ok: false, code: 'invalid-id' })
  assert.deepEqual(model.normalizeWatchlistChannelInput('trailing-', 'twitch'), { ok: false, code: 'invalid-id' })
  assert.deepEqual(model.normalizeWatchlistChannelInput('x'.repeat(65), 'twitch'), { ok: false, code: 'invalid-id' })
  assert.deepEqual(model.normalizeWatchlistChannelInput('bad space', 'twitch'), { ok: false, code: 'invalid-id' })
  assert.equal(model.normalizeStoredChannelId('_valid_'), '_valid_')
  assert.equal(model.normalizeStoredChannelId('invalid!'), '')

  assert.equal(model.normalizeWatchlistDisplayName('  Example\u0000 Name  ', 'fallback'), 'Example Name')
  assert.equal(model.normalizeWatchlistDisplayName('', 'fallback'), 'fallback')
  assert.equal(Array.from(model.normalizeWatchlistDisplayName('界'.repeat(101))).length, 100)
  assert.equal(model.normalizeIsoTimestamp('2026-06-24T00:00:00.000Z'), '2026-06-24T00:00:00.000Z')
  assert.equal(model.normalizeIsoTimestamp('not-a-date'), '')
  assert.throws(() => model.currentIsoTimestamp('not-a-date'), /valid timestamp/)

  const base = model.createWatchlistDocument('twitch', [], '2026-06-24T00:00:00.000Z')
  assert.deepEqual(base, {
    schema: 'viewloom-watchlist-v1',
    provider: 'twitch',
    revision: 1,
    updatedAt: '2026-06-24T00:00:00.000Z',
    entries: [],
  })

  const added = model.addWatchlistEntry(
    base,
    'https://www.twitch.tv/Example_Channel',
    'Example Name',
    '2026-06-24T01:00:00.000Z',
  )
  assert.equal(added.ok, true)
  assert.equal(added.changed, true)
  assert.equal(added.document.entries[0].channelId, 'example_channel')
  assert.equal(added.document.entries[0].displayName, 'Example Name')
  assert.equal(added.document.updatedAt, '2026-06-24T01:00:00.000Z')
  assert.equal(base.entries.length, 0, 'base document was mutated')

  const duplicate = model.addWatchlistEntry(
    added.document,
    'example_channel',
    'Replacement',
    '2026-06-24T02:00:00.000Z',
  )
  assert.deepEqual(duplicate, {
    ok: false,
    code: 'already-saved',
    document: added.document,
    changed: false,
  })
  assert.equal(duplicate.document.entries[0].displayName, 'Example Name')
  assert.equal(duplicate.document.updatedAt, '2026-06-24T01:00:00.000Z')

  let full = base
  for (let index = 0; index < 50; index += 1) {
    const result = model.addWatchlistEntry(
      full,
      `channel_${String(index).padStart(2, '0')}`,
      '',
      new Date(Date.UTC(2026, 5, 24, 2, 0, index)),
    )
    assert.equal(result.ok, true)
    full = result.document
  }
  assert.equal(full.entries.length, 50)
  const overLimit = model.addWatchlistEntry(full, 'channel_50', '', '2026-06-24T03:00:00.000Z')
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
  assert.equal(moved.changed, true)
  assert.deepEqual(moved.document.entries.map((value) => value.channelId), ['beta', 'alpha', 'gamma'])
  assert.deepEqual(ordered.entries.map((value) => value.channelId), ['alpha', 'beta', 'gamma'])

  const edge = model.moveWatchlistEntry(ordered, 'alpha', 'up', '2026-06-24T04:00:00.000Z')
  assert.equal(edge.ok, true)
  assert.equal(edge.changed, false)
  assert.equal(edge.document, ordered)

  const missingMove = model.moveWatchlistEntry(ordered, 'missing', 'down')
  assert.equal(missingMove.ok, false)
  assert.equal(missingMove.code, 'not-found')

  const removed = model.removeWatchlistEntry(ordered, 'beta', '2026-06-24T05:00:00.000Z')
  assert.equal(removed.ok, true)
  assert.deepEqual(removed.document.entries.map((value) => value.channelId), ['alpha', 'gamma'])
  assert.equal(model.removeWatchlistEntry(ordered, 'missing').code, 'not-found')

  const cleared = model.clearWatchlistDocument(ordered, '2026-06-24T06:00:00.000Z')
  assert.equal(cleared.ok, true)
  assert.equal(cleared.changed, true)
  assert.equal(cleared.document.entries.length, 0)
  const emptyClear = model.clearWatchlistDocument(base)
  assert.equal(emptyClear.changed, false)
  assert.equal(emptyClear.document, base)
}

function verifyStorage(model, storage) {
  assert.equal(storage.watchlistStorageKey('twitch'), 'viewloom.watchlist.twitch.v1')
  assert.equal(storage.watchlistStorageKey('kick'), 'viewloom.watchlist.kick.v1')

  const memory = createMemoryStorage()
  const missing = storage.readWatchlistStorage(memory.api, 'twitch', '2026-06-24T00:00:00.000Z')
  assert.equal(missing.ok, true)
  assert.equal(missing.state, 'empty')
  assert.equal(missing.persisted, false)
  assert.equal(memory.calls.get, 1)
  assert.equal(memory.calls.set, 0)

  const base = missing.document
  const storedAdd = storage.addStoredWatchlistEntry(
    memory.api,
    base,
    'Example_Channel',
    'Example',
    '2026-06-24T01:00:00.000Z',
  )
  assert.equal(storedAdd.ok, true)
  assert.equal(storedAdd.changed, true)
  assert.equal(memory.calls.set, 1)
  assert.ok(memory.values.has('viewloom.watchlist.twitch.v1'))
  assert.equal(memory.values.has('viewloom.watchlist.kick.v1'), false)

  const reread = storage.readWatchlistStorage(memory.api, 'twitch')
  assert.equal(reread.ok, true)
  assert.equal(reread.state, 'ready')
  assert.equal(reread.document.entries[0].channelId, 'example_channel')

  const setBeforeDuplicate = memory.calls.set
  const duplicate = storage.addStoredWatchlistEntry(memory.api, reread.document, 'example_channel', 'Replacement')
  assert.equal(duplicate.ok, false)
  assert.equal(duplicate.code, 'already-saved')
  assert.equal(memory.calls.set, setBeforeDuplicate)

  const movedBase = model.createWatchlistDocument('twitch', [
    entry('alpha', 'Alpha', '2026-06-24T00:00:00.000Z'),
    entry('beta', 'Beta', '2026-06-24T00:01:00.000Z'),
  ], '2026-06-24T00:02:00.000Z')
  const storedMove = storage.moveStoredWatchlistEntry(
    memory.api,
    movedBase,
    'beta',
    'up',
    '2026-06-24T02:00:00.000Z',
  )
  assert.equal(storedMove.ok, true)
  assert.deepEqual(storedMove.document.entries.map((value) => value.channelId), ['beta', 'alpha'])
  const storedRemove = storage.removeStoredWatchlistEntry(
    memory.api,
    storedMove.document,
    'alpha',
    '2026-06-24T03:00:00.000Z',
  )
  assert.equal(storedRemove.ok, true)
  assert.deepEqual(storedRemove.document.entries.map((value) => value.channelId), ['beta'])

  const writeFailureStorage = createMemoryStorage({ throwOnSet: true })
  const failedWrite = storage.addStoredWatchlistEntry(
    writeFailureStorage.api,
    base,
    'new_channel',
    '',
    '2026-06-24T04:00:00.000Z',
  )
  assert.equal(failedWrite.ok, false)
  assert.equal(failedWrite.code, 'write-failed')
  assert.deepEqual(failedWrite.document, base)
  assert.equal(failedWrite.document.entries.length, 0)

  const unavailableWrite = storage.addStoredWatchlistEntry(null, base, 'new_channel')
  assert.equal(unavailableWrite.ok, false)
  assert.equal(unavailableWrite.code, 'storage-unavailable')
  assert.equal(unavailableWrite.document, base)

  const readFailureStorage = createMemoryStorage({ throwOnGet: true })
  const failedRead = storage.readWatchlistStorage(readFailureStorage.api, 'kick')
  assert.deepEqual(failedRead, {
    ok: false,
    state: 'unavailable',
    code: 'storage-unavailable',
    repaired: false,
    persisted: false,
  })

  const corruptMemory = createMemoryStorage()
  corruptMemory.values.set('viewloom.watchlist.twitch.v1', '{bad json')
  const corrupted = storage.readWatchlistStorage(corruptMemory.api, 'twitch')
  assert.equal(corrupted.ok, false)
  assert.equal(corrupted.state, 'corrupted')
  assert.equal(corruptMemory.calls.set, 0, 'corrupted value was overwritten')
  assert.equal(corruptMemory.values.get('viewloom.watchlist.twitch.v1'), '{bad json')

  const wrongProvider = storage.parseWatchlistDocument(JSON.stringify({
    schema: 'viewloom-watchlist-v1',
    provider: 'kick',
    revision: 1,
    updatedAt: '2026-06-24T00:00:00.000Z',
    entries: [],
  }), 'twitch')
  assert.deepEqual(wrongProvider, { ok: false, code: 'storage-corrupted' })

  const repairMemory = createMemoryStorage()
  const candidates = [
    entry('UPPER_CASE', '  Upper\u0000 Case  ', '2026-06-24T00:00:00.000Z'),
    entry('upper_case', 'Duplicate', '2026-06-24T00:01:00.000Z'),
    entry('invalid!', 'Invalid', '2026-06-24T00:02:00.000Z'),
    ...Array.from({ length: 51 }, (_, index) => entry(
      `valid_${String(index).padStart(2, '0')}`,
      `Valid ${index}`,
      new Date(Date.UTC(2026, 5, 24, 1, 0, index)).toISOString(),
    )),
  ]
  repairMemory.values.set('viewloom.watchlist.twitch.v1', JSON.stringify({
    schema: 'viewloom-watchlist-v1',
    provider: 'twitch',
    revision: 1,
    updatedAt: '2026-06-24T02:00:00.000Z',
    entries: candidates,
  }))
  const repaired = storage.readWatchlistStorage(repairMemory.api, 'twitch')
  assert.equal(repaired.ok, true)
  assert.equal(repaired.state, 'repaired')
  assert.equal(repaired.repaired, true)
  assert.equal(repaired.persisted, true)
  assert.equal(repaired.document.entries.length, 50)
  assert.equal(repaired.document.entries[0].channelId, 'upper_case')
  assert.equal(repaired.document.entries[0].displayName, 'Upper Case')
  assert.equal(repairMemory.calls.set, 1)

  const repairWriteFailure = createMemoryStorage({ throwOnSet: true })
  repairWriteFailure.values.set('viewloom.watchlist.twitch.v1', JSON.stringify({
    schema: 'viewloom-watchlist-v1',
    provider: 'twitch',
    revision: 1,
    updatedAt: '2026-06-24T02:00:00.000Z',
    entries: [entry('UPPER', 'Upper', '2026-06-24T00:00:00.000Z')],
  }))
  const inMemoryRepair = storage.readWatchlistStorage(repairWriteFailure.api, 'twitch')
  assert.equal(inMemoryRepair.ok, true)
  assert.equal(inMemoryRepair.state, 'write_error')
  assert.equal(inMemoryRepair.code, 'write-failed')
  assert.equal(inMemoryRepair.document.entries[0].channelId, 'upper')
  assert.equal(inMemoryRepair.persisted, false)

  const unrelatedEvent = storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.kick.v1',
    newValue: null,
  })
  assert.deepEqual(unrelatedEvent, { matched: false })

  const clearEvent = storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.twitch.v1',
    newValue: null,
  }, '2026-06-24T05:00:00.000Z')
  assert.equal(clearEvent.matched, true)
  assert.equal(clearEvent.result.ok, true)
  assert.equal(clearEvent.result.state, 'empty')

  const corruptEvent = storage.readWatchlistStorageEvent('twitch', {
    key: 'viewloom.watchlist.twitch.v1',
    newValue: '{bad',
  })
  assert.equal(corruptEvent.matched, true)
  assert.equal(corruptEvent.result.ok, false)
  assert.equal(corruptEvent.result.state, 'corrupted')

  const clearMemory = createMemoryStorage()
  clearMemory.values.set('viewloom.watchlist.twitch.v1', 'twitch-data')
  clearMemory.values.set('viewloom.watchlist.kick.v1', 'kick-data')
  const notConfirmed = storage.clearStoredWatchlist(clearMemory.api, movedBase, false)
  assert.equal(notConfirmed.ok, false)
  assert.equal(notConfirmed.code, 'confirmation-required')
  assert.equal(clearMemory.calls.remove, 0)
  const cleared = storage.clearStoredWatchlist(
    clearMemory.api,
    movedBase,
    true,
    '2026-06-24T06:00:00.000Z',
  )
  assert.equal(cleared.ok, true)
  assert.equal(cleared.document.entries.length, 0)
  assert.equal(clearMemory.values.has('viewloom.watchlist.twitch.v1'), false)
  assert.equal(clearMemory.values.get('viewloom.watchlist.kick.v1'), 'kick-data')

  const resetMemory = createMemoryStorage()
  resetMemory.values.set('viewloom.watchlist.kick.v1', '{bad')
  assert.equal(storage.resetStoredWatchlist(resetMemory.api, 'kick', false).code, 'confirmation-required')
  const reset = storage.resetStoredWatchlist(
    resetMemory.api,
    'kick',
    true,
    '2026-06-24T07:00:00.000Z',
  )
  assert.equal(reset.ok, true)
  assert.equal(reset.document.provider, 'kick')
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
    new URL(`https://vl.example/twitch/watchlist/${sevenDay.includes('?') ? '?period=7d' : ''}`),
    { provider: 'twitch', period: '30d' },
  )
  assert.equal(cleanDefault, '/twitch/watchlist/')

  const forward = urlState.parseWatchlistUrlState(
    new URL(`https://vl.example${sevenDay}`),
    'twitch',
  )
  const back = urlState.parseWatchlistUrlState(
    new URL('https://vl.example/twitch/watchlist/'),
    'twitch',
  )
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
  return diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('; ')
}
