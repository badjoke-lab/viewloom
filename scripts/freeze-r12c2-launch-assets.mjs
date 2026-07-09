import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'

const evidencePath = process.argv[2] || 'artifacts/r12c2-launch-assets/evidence.json'
const sourceDir = process.argv[3] || 'artifacts/r12c2-launch-assets'
const packageRoot = process.argv[4] || 'docs/assets/launch/r12c2'

const evidence = JSON.parse(await readFile(evidencePath, 'utf8'))

if (evidence.schema !== 'viewloom-r12c2-launch-assets-capture-v1') {
  throw new Error(`unexpected evidence schema: ${evidence.schema}`)
}
if (evidence.result !== 'pass') {
  throw new Error(`capture evidence is not passing: ${evidence.result}`)
}
if (!Array.isArray(evidence.assets) || evidence.assets.length !== 6) {
  throw new Error(`expected 6 assets, received ${evidence.assets?.length ?? 'unknown'}`)
}

await mkdir(packageRoot, { recursive: true })

const assets = []
for (const asset of evidence.assets) {
  const sourcePath = resolve(sourceDir, asset.filename)
  const destinationPath = resolve(packageRoot, asset.filename)
  await copyFile(sourcePath, destinationPath)

  assets.push({
    id: asset.id,
    filename: asset.filename,
    path: `${packageRoot}/${asset.filename}`,
    route: asset.route,
    viewport: asset.viewport,
    provider: asset.provider,
    intendedUse: asset.intendedUse,
    caption: asset.caption,
    sha256: asset.sha256,
    sizeBytes: asset.sizeBytes,
    publicSurfaceEvidence: {
      status: asset.status,
      title: asset.facts?.title ?? null,
      h1: asset.facts?.h1 ?? null,
      canonical: asset.facts?.canonical ?? null,
      horizontalOverflowPx: asset.facts?.bodyOverflow ?? null,
      loadingPatternsRemaining: asset.facts?.loadingPatternsRemaining ?? [],
    },
  })
}

const manifest = {
  schema: 'viewloom-r12c2-launch-asset-manifest-v1',
  phase: 'Phase 12',
  workstream: 'R12C-2',
  packageRoot,
  capture: {
    origin: evidence.origin,
    checkedAt: evidence.checked_at,
    evidenceSchema: evidence.schema,
    result: evidence.result,
    headSha: process.env.R12C2_HEAD_SHA || process.env.GITHUB_SHA || null,
    workflowRunId: process.env.GITHUB_RUN_ID || null,
    workflowName: 'Release R12C2 Launch Assets',
  },
  assetCount: assets.length,
  assets,
  boundaries: [
    'Screenshots represent current production surfaces at the recorded capture time.',
    'Captions describe observed product roles and do not claim complete platform coverage.',
    'Twitch and Kick observations remain separated by provider.',
    'The package does not claim official platform analytics, unique viewers, creator revenue, exact session reconstruction, causal audience explanations, combined provider totals, or cross-platform rankings.',
  ],
}

await mkdir(dirname('docs/audits/r12c2-launch-asset-manifest.json'), { recursive: true })
await writeFile(
  'docs/audits/r12c2-launch-asset-manifest.json',
  `${JSON.stringify(manifest, null, 2)}\n`,
)

const captionLines = [
  '# ViewLoom R12C-2 launch asset caption package',
  '',
  'Status: approved English launch/share caption source',
  'Phase: Phase 12',
  'Workstream: R12C-2',
  '',
  'These captions are bounded by the R12C-1 English launch-copy package. They describe product roles and observed fields without claiming complete platform coverage, official analytics, unique viewers, causal explanations, combined Twitch/Kick totals, or cross-platform rankings.',
  '',
  '## Assets',
  '',
]

for (const asset of assets) {
  captionLines.push(`### ${asset.id}`)
  captionLines.push('')
  captionLines.push(`- File: \`${basename(asset.path)}\``)
  captionLines.push(`- Source route: \`${asset.route}\``)
  captionLines.push(`- Viewport: \`${asset.viewport.width}×${asset.viewport.height}\``)
  captionLines.push(`- Intended use: ${asset.intendedUse.join('; ')}`)
  captionLines.push('')
  captionLines.push(asset.caption)
  captionLines.push('')
}

captionLines.push('## Usage boundary')
captionLines.push('')
captionLines.push('Use the manifest as the source of truth for file hashes, source routes, viewport sizes, capture time, and intended external use. Do not rewrite these captions into stronger coverage, causality, official-affiliation, revenue, unique-viewer, session-precision, provider-combination, or cross-platform-ranking claims.')
captionLines.push('')

await mkdir(dirname('docs/product/launch-asset-captions.md'), { recursive: true })
await writeFile('docs/product/launch-asset-captions.md', `${captionLines.join('\n')}\n`)

console.log(JSON.stringify({
  result: 'pass',
  packageRoot,
  manifest: 'docs/audits/r12c2-launch-asset-manifest.json',
  captions: 'docs/product/launch-asset-captions.md',
  assets: assets.length,
}, null, 2))
