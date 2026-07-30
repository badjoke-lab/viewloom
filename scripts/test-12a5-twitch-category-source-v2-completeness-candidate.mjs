import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const sourcePath = 'workers/shared/category-capture-v2-candidate.ts'
const source = readFileSync(sourcePath, 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    strict: true,
  },
  fileName: sourcePath,
  reportDiagnostics: true,
})
assert.deepEqual(output.diagnostics ?? [], [], 'candidate transpile diagnostics')

const temp = mkdtempSync(path.join(tmpdir(), 'viewloom-category-source-v2-'))
try {
  const modulePath = path.join(temp, 'candidate.mjs')
  writeFileSync(modulePath, output.outputText)
  const candidate = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`)

  assert.equal(candidate.CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION, 'category-source-v2-candidate')
  assert.equal(candidate.CATEGORY_SOURCE_STATE_ENCODING, '2bit-hex-v1')
  assert.equal(candidate.classifyCategorySourceState({ categoryProviderId: '1', categoryName: 'A' }), 'both_present')
  assert.equal(candidate.classifyCategorySourceState({ categoryProviderId: '', categoryName: '' }), 'both_empty')
  assert.equal(candidate.classifyCategorySourceState({ categoryProviderId: '2', categoryName: '' }), 'provider_id_only')
  assert.equal(candidate.classifyCategorySourceState({ categoryProviderId: '', categoryName: 'B' }), 'category_name_only')
  assert.equal(candidate.classifyCategorySourceState({ categoryProviderId: '  3 ', categoryName: ' C   Name ' }), 'both_present')

  const encoded = candidate.encodeCategorySourceCompletenessV2Candidate([
    { categoryProviderId: '1', categoryName: 'A' },
    { categoryProviderId: '', categoryName: '' },
    { categoryProviderId: '2', categoryName: '' },
    { categoryProviderId: '', categoryName: 'B' },
    { categoryProviderId: '1', categoryName: 'A2' },
  ])
  assert.deepEqual(encoded.payloadFields.categoryIds, ['1'])
  assert.deepEqual(encoded.payloadFields.categoryRefs, [0, null, null, null, 0])
  assert.deepEqual(encoded.payloadFields.categorySourceStateCounts, {
    bothPresent: 2,
    bothEmpty: 1,
    providerIdOnly: 1,
    categoryNameOnly: 1,
  })
  assert.deepEqual(encoded.payloadFields.categorySourceStateEncoding, {
    format: '2bit-hex-v1',
    itemCount: 5,
    packedHex: 'e400',
  })
  assert.deepEqual(candidate.unpackCategorySourceStateCodes('e400', 5), [0, 1, 2, 3, 0])
  assert.deepEqual(encoded.dictionaryEntries, [{ id: '1', name: 'A2' }])
  assert.equal(encoded.observedItems, 2)
  assert.equal(encoded.missingItems, 3)
  assert.equal(encoded.partialPairItems, 2)
  assert.equal(encoded.coverageState, 'missing_from_source')
  const encodedKeys = collectObjectKeys(encoded)
  assert.equal(encodedKeys.has('categoryProviderId'), false)
  assert.equal(encodedKeys.has('categoryName'), false)

  const empty = candidate.encodeCategorySourceCompletenessV2Candidate([])
  assert.equal(empty.coverageState, 'unavailable')
  assert.deepEqual(empty.payloadFields.categorySourceStateEncoding, {
    format: '2bit-hex-v1',
    itemCount: 0,
    packedHex: '',
  })
  const partialCoverage = candidate.encodeCategorySourceCompletenessV2Candidate([
    { categoryProviderId: '1', categoryName: 'A' },
  ], true)
  assert.equal(partialCoverage.coverageState, 'partial_source_coverage')

  assert.throws(() => candidate.unpackCategorySourceStateCodes('zz', 1), /invalid_packed_hex/)
  assert.throws(() => candidate.unpackCategorySourceStateCodes('00', -1), /invalid_item_count/)
  assert.throws(() => candidate.unpackCategorySourceStateCodes('00', 5), /packed_length_mismatch/)

  const capacityItems = Array.from({ length: 300 }, (_, index) => {
    if (index % 75 === 0) return { categoryProviderId: '', categoryName: '' }
    if (index % 75 === 1) return { categoryProviderId: String(index), categoryName: '' }
    if (index % 75 === 2) return { categoryProviderId: '', categoryName: `Name ${index}` }
    return { categoryProviderId: String(index % 100), categoryName: `Name ${index % 100}` }
  })
  const capacity = candidate.encodeCategorySourceCompletenessV2Candidate(capacityItems)
  const v1Comparable = {
    categoryContractVersion: 'category-source-v1',
    categoryIds: capacity.payloadFields.categoryIds,
    categoryRefs: capacity.payloadFields.categoryRefs,
  }
  const v1Bytes = Buffer.byteLength(JSON.stringify(v1Comparable))
  const v2Bytes = Buffer.byteLength(JSON.stringify(capacity.payloadFields))
  const overheadBytes = v2Bytes - v1Bytes
  assert.equal(capacity.payloadFields.categorySourceStateEncoding.itemCount, 300)
  assert.equal(capacity.payloadFields.categorySourceStateEncoding.packedHex.length, 150)
  assert.ok(overheadBytes <= 400, `candidate payload overhead ${overheadBytes} exceeds 400 bytes`)
  assert.deepEqual(
    candidate.unpackCategorySourceStateCodes(
      capacity.payloadFields.categorySourceStateEncoding.packedHex,
      capacity.payloadFields.categorySourceStateEncoding.itemCount,
    ).slice(0, 8),
    [1, 2, 3, 0, 0, 0, 0, 0],
  )
  assert.deepEqual(
    candidate.encodeCategorySourceCompletenessV2Candidate(capacityItems),
    capacity,
    'encoding must be deterministic',
  )

  console.log(JSON.stringify({
    ok: true,
    contractVersion: candidate.CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION,
    stateEncoding: candidate.CATEGORY_SOURCE_STATE_ENCODING,
    fixturePackedHex: encoded.payloadFields.categorySourceStateEncoding.packedHex,
    capacityItems: capacityItems.length,
    packedHexChars: capacity.payloadFields.categorySourceStateEncoding.packedHex.length,
    v1ComparableBytes: v1Bytes,
    v2CandidateBytes: v2Bytes,
    overheadBytes,
    productionExecution: false,
  }, null, 2))
} finally {
  rmSync(temp, { recursive: true, force: true })
}

function collectObjectKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys)
    return keys
  }
  if (!value || typeof value !== 'object') return keys
  for (const [key, nested] of Object.entries(value)) {
    keys.add(key)
    collectObjectKeys(nested, keys)
  }
  return keys
}
