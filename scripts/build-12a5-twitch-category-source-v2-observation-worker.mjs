import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ACTIVE_INDEX = 'workers/collector-twitch/src/index-category.ts'
const ACTIVE_ENTRY = 'workers/collector-twitch/src/entry.ts'
const CANDIDATE = 'workers/shared/category-capture-v2-candidate.ts'
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'workers/collector-twitch/.generated-v2-observation'
const EXPECTED_BLOBS = {
  activeIndex: '2b3bd54b92e26f802c05048160ed293b0b4e9d43',
  activeEntry: '26be160414bfe38ebf8ce61660f8478b570454b6',
  candidate: '57df5b3e12a27587a6345a3bf2a6155d3dd669e5',
}

const blob = (file) => execFileSync('git', ['hash-object', file], { encoding: 'utf8' }).trim()
assert.equal(blob(ACTIVE_INDEX), EXPECTED_BLOBS.activeIndex, 'active Twitch category collector changed')
assert.equal(blob(ACTIVE_ENTRY), EXPECTED_BLOBS.activeEntry, 'active Twitch entry changed')
assert.equal(blob(CANDIDATE), EXPECTED_BLOBS.candidate, 'accepted v2 candidate changed')

const activeIndex = readFileSync(ACTIVE_INDEX, 'utf8')
const activeEntry = readFileSync(ACTIVE_ENTRY, 'utf8')

const categoryImport = `import {
  categoryCaptureEnabled,
  encodeCategorySnapshot,
  stripCategorySourceFields,
  writeCategoryDictionary,
} from '../../shared/category-capture'`
assert.equal(activeIndex.split(categoryImport).length, 2, 'category import anchor changed')

const envAnchor = `  CATEGORY_CAPTURE_ENABLED?: string
}`
assert.equal(activeIndex.split(envAnchor).length, 2, 'collector env anchor changed')
assert.equal(activeEntry.split(envAnchor).length, 2, 'entry env anchor changed')

const encodingAnchor = `  const categoryEnabled = categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)
  const encoded = categoryEnabled ? encodeCategorySnapshot(input.items, input.hasMore) : null`
assert.equal(activeIndex.split(encodingAnchor).length, 2, 'category encoding anchor changed')

let generatedIndex = activeIndex.replace(
  categoryImport,
  `${categoryImport}
import { encodeCategorySourceCompletenessV2Candidate } from '../../shared/category-capture-v2-candidate'`,
)
generatedIndex = generatedIndex.replace(
  envAnchor,
  `  CATEGORY_CAPTURE_ENABLED?: string
  CATEGORY_SOURCE_V2_OBSERVATION_ENABLED?: string
}`,
)
generatedIndex = generatedIndex.replace(
  encodingAnchor,
  `  const categoryEnabled = categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)
  const v2ObservationEnabled = categoryEnabled
    && String(env.CATEGORY_SOURCE_V2_OBSERVATION_ENABLED ?? '').trim().toLowerCase() === 'true'
  const encoded = categoryEnabled
    ? v2ObservationEnabled
      ? encodeCategorySourceCompletenessV2Candidate(input.items, input.hasMore)
      : encodeCategorySnapshot(input.items, input.hasMore)
    : null`,
)

let generatedEntry = activeEntry.replace("import collector from './index'", "import collector from './index-category'")
generatedEntry = generatedEntry.replace(
  envAnchor,
  `  CATEGORY_CAPTURE_ENABLED?: string
  CATEGORY_SOURCE_V2_OBSERVATION_ENABLED?: string
}`,
)

for (const [name, source] of Object.entries({ generatedIndex, generatedEntry })) {
  assert.ok(source.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), `${name}: v2 flag missing`)
}
assert.ok(generatedIndex.includes('encodeCategorySourceCompletenessV2Candidate(input.items, input.hasMore)'))
assert.ok(generatedIndex.includes("encodeCategorySnapshot(input.items, input.hasMore)"), 'v1 rollback path missing')
assert.equal(generatedEntry.includes("import collector from './index-category'"), true)

rmSync(OUTPUT_DIR, { recursive: true, force: true })
mkdirSync(OUTPUT_DIR, { recursive: true })
writeFileSync(path.join(OUTPUT_DIR, 'index-category.ts'), generatedIndex)
writeFileSync(path.join(OUTPUT_DIR, 'entry.ts'), generatedEntry)
const manifest = {
  schemaVersion: 'viewloom-12a5-twitch-category-source-v2-generated-worker-v1',
  outputDir: OUTPUT_DIR,
  sourceBlobs: EXPECTED_BLOBS,
  generatedFiles: ['entry.ts', 'index-category.ts'],
  contractVersion: 'category-source-v2-candidate',
  observationFlag: 'CATEGORY_SOURCE_V2_OBSERVATION_ENABLED',
  v1DefaultPreserved: true,
  activeSourceModified: false,
}
writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify(manifest, null, 2))
