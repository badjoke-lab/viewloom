import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const contractPath = process.argv[2] || 'docs/audits/phase12-production-closeout-contract.json'
const outputPath = process.argv[3] || 'docs/audits/phase12-release-acceptance.json'
const artifactDir = process.env.PHASE12_CLOSEOUT_ARTIFACT_DIR || 'artifacts/phase12-production-closeout'
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const manifest = JSON.parse(readFileSync(contract.launchAssetManifest, 'utf8'))
const candidate = JSON.parse(readFileSync(contract.candidateEvidence, 'utf8'))
const origin = contract.origin.replace(/\/$/, '')

mkdirSync(artifactDir, { recursive: true })
mkdirSync(dirname(outputPath), { recursive: true })

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}

const fetchText = async (path) => {
  const response = await fetchWithTimeout(`${origin}${path}`)
  const text = await response.text()
  return { response, text }
}

const fetchJson = async (path) => {
  const response = await fetchWithTimeout(`${origin}${path}`)
  const text = await response.text()
  let value
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error(`${path}: response is not valid JSON`)
  }
  return { response, text, value }
}

const deploymentPath = join(artifactDir, 'deployment.json')
let deployment = null
for (let attempt = 1; attempt <= 60; attempt += 1) {
  try {
    const { response, text, value } = await fetchJson(`/deployment.json?phase12_closeout_attempt=${attempt}`)
    writeFileSync(deploymentPath, `${text.trim()}\n`)
    const matches = response.status === 200
      && value.commit_sha === contract.expectedMainSha
      && value.environment === contract.requirements.deploymentEnvironment
      && value.branch === contract.requirements.deploymentBranch
    if (matches) {
      deployment = value
      break
    }
  } catch (error) {
    console.log(`deployment probe ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  await sleep(10_000)
}
if (!deployment) throw new Error(`production did not reach expected SHA ${contract.expectedMainSha}`)

const routeResults = []
for (const route of contract.htmlRoutes) {
  const { response, text } = await fetchText(route)
  const canonicalMatch = text.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
    || text.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i)
  const expectedCanonical = `${origin}${route}`
  const result = {
    route,
    status: response.status,
    hasViewLoom: /ViewLoom/i.test(text),
    canonical: canonicalMatch?.[1] ?? null,
    canonicalMatches: canonicalMatch?.[1] === expectedCanonical,
  }
  routeResults.push(result)
  const name = route === '/' ? 'portal' : route.replace(/^\//, '').replace(/\/$/, '').replaceAll('/', '-')
  writeFileSync(join(artifactDir, `${name}.html`), text)
}

const support = routeResults.find((item) => item.route === '/support/')
const supportHtml = readFileSync(join(artifactDir, 'support.html'), 'utf8')
const supportChecks = {
  routeStatus: support?.status ?? null,
  paymentLinkPresent: supportHtml.includes(contract.supportPaymentLink),
  refundPolicyLinkPresent: supportHtml.includes('/refund-policy/'),
  commercialDisclosureLinkPresent: supportHtml.includes('/commercial-disclosure/'),
  contactLinkPresent: supportHtml.includes('/contact/'),
}

const twitchStatusResponse = await fetchJson('/api/twitch-status')
const kickStatusResponse = await fetchJson('/api/kick-status')
writeFileSync(join(artifactDir, 'twitch-status.json'), `${JSON.stringify(twitchStatusResponse.value, null, 2)}\n`)
writeFileSync(join(artifactDir, 'kick-status.json'), `${JSON.stringify(kickStatusResponse.value, null, 2)}\n`)

const twitch = twitchStatusResponse.value
const kick = kickStatusResponse.value
const providerChecks = {
  twitch: {
    httpStatus: twitchStatusResponse.response.status,
    platform: twitch.platform,
    binding: twitch.storage?.binding ?? null,
    database: twitch.storage?.database ?? null,
    sourceMode: twitch.sourceMode ?? null,
    collectorState: twitch.collector?.state ?? null,
    isStale: twitch.freshness?.isStale ?? null,
    observedCount: twitch.latestSnapshot?.observedCount ?? 0,
    topLimit: twitch.latestSnapshot?.topLimit ?? null,
    hasMore: twitch.latestSnapshot?.hasMore ?? false,
    coveredPages: twitch.latestSnapshot?.coveredPages ?? null,
  },
  kick: {
    httpStatus: kickStatusResponse.response.status,
    platform: kick.platform,
    binding: kick.storage?.binding ?? null,
    database: kick.storage?.database ?? null,
    sourceMode: kick.sourceMode ?? null,
    collectorState: kick.collector?.state ?? null,
    isFresh: kick.freshness?.isFresh ?? null,
    isStale: kick.freshness?.isStale ?? null,
    observedCount: kick.latestSnapshot?.observedCount ?? 0,
    topLimit: kick.latestSnapshot?.topLimit ?? null,
  },
}

const capacityState = ({ observedCount, topLimit, hasMore = false }) => {
  if (hasMore || (Number.isFinite(topLimit) && topLimit > 0 && observedCount >= topLimit)) return 'at-or-over-window'
  if (Number.isFinite(topLimit) && topLimit > 0 && observedCount / topLimit >= 0.9) return 'near-window-limit'
  return 'within-window'
}

const monitoring = {
  twitchCapacity: capacityState(providerChecks.twitch),
  kickCapacity: capacityState(providerChecks.kick),
  alerts: [],
}
if (providerChecks.twitch.isStale === true) monitoring.alerts.push({ severity: 'high', code: 'twitch_stale' })
if (providerChecks.kick.isStale === true) monitoring.alerts.push({ severity: 'high', code: 'kick_stale' })
if (monitoring.twitchCapacity !== 'within-window') monitoring.alerts.push({ severity: 'watch', code: `twitch_${monitoring.twitchCapacity}` })
if (monitoring.kickCapacity !== 'within-window') monitoring.alerts.push({ severity: 'watch', code: `kick_${monitoring.kickCapacity}` })

const sitemap = await fetchText(contract.sitemapUrl)
writeFileSync(join(artifactDir, 'sitemap.xml'), sitemap.text)
const sitemapRouteCount = [...sitemap.text.matchAll(/<loc>/g)].length

const assetResults = []
for (const asset of manifest.assets) {
  const publicPath = `/launch-assets/${asset.filename}`
  const response = await fetchWithTimeout(`${origin}${publicPath}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const hash = createHash('sha256').update(bytes).digest('hex')
  assetResults.push({
    id: asset.id,
    publicPath,
    status: response.status,
    sizeBytes: bytes.length,
    expectedSizeBytes: asset.sizeBytes,
    sha256: hash,
    expectedSha256: asset.sha256,
    hashMatches: hash === asset.sha256,
    sizeMatches: bytes.length === asset.sizeBytes,
  })
}

const notFoundPath = `/phase12-production-closeout-not-found-${contract.expectedMainSha}`
const notFound = await fetchText(notFoundPath)
const previewProbe = await fetchText('/cloudflare-preview-probe.json')
const notFoundChecks = {
  explicitStatus: notFound.response.status,
  explicitMarkerPresent: notFound.text.includes('data-viewloom-not-found="v1"'),
  previewProbeStatus: previewProbe.response.status,
  previewProbeMarkerPresent: previewProbe.text.includes('data-viewloom-not-found="v1"'),
}

const blockingAlerts = monitoring.alerts.filter((alert) => ['critical', 'high'].includes(alert.severity))
const failures = []
if (routeResults.length !== 25) failures.push(`route count ${routeResults.length}`)
for (const item of routeResults) {
  if (item.status !== contract.requirements.htmlStatus) failures.push(`${item.route}: HTTP ${item.status}`)
  if (!item.hasViewLoom) failures.push(`${item.route}: ViewLoom ownership missing`)
  if (!item.canonicalMatches) failures.push(`${item.route}: canonical mismatch ${item.canonical}`)
}
if (!Object.values(supportChecks).every((value) => value === true || value === 200)) failures.push('support links/payment contract failed')
if (providerChecks.twitch.httpStatus !== 200) failures.push('Twitch status HTTP failed')
if (providerChecks.twitch.platform !== 'twitch') failures.push('Twitch platform mismatch')
if (providerChecks.twitch.binding !== contract.requirements.providerBindings.twitch) failures.push('Twitch binding mismatch')
if (providerChecks.twitch.sourceMode !== 'real') failures.push('Twitch sourceMode mismatch')
if (providerChecks.twitch.collectorState !== 'ok') failures.push('Twitch collector state mismatch')
if (providerChecks.twitch.isStale !== false) failures.push('Twitch stale')
if (providerChecks.kick.httpStatus !== 200) failures.push('Kick status HTTP failed')
if (providerChecks.kick.platform !== 'kick') failures.push('Kick platform mismatch')
if (providerChecks.kick.binding !== contract.requirements.providerBindings.kick) failures.push('Kick binding mismatch')
if (providerChecks.kick.sourceMode !== 'authenticated') failures.push('Kick sourceMode mismatch')
if (providerChecks.kick.collectorState !== 'snapshot_available') failures.push('Kick collector state mismatch')
if (providerChecks.kick.isFresh !== true || providerChecks.kick.isStale !== false) failures.push('Kick freshness failed')
if (sitemap.response.status !== 200) failures.push(`sitemap HTTP ${sitemap.response.status}`)
if (sitemapRouteCount !== contract.expectedSitemapRoutes) failures.push(`sitemap route count ${sitemapRouteCount}`)
for (const asset of assetResults) {
  if (asset.status !== 200) failures.push(`${asset.id}: HTTP ${asset.status}`)
  if (!asset.hashMatches) failures.push(`${asset.id}: hash mismatch`)
  if (!asset.sizeMatches) failures.push(`${asset.id}: size mismatch`)
}
if (notFoundChecks.explicitStatus !== contract.requirements.explicitNotFoundStatus || !notFoundChecks.explicitMarkerPresent) failures.push('explicit 404 contract failed')
if (notFoundChecks.previewProbeStatus !== contract.requirements.previewProbeStatus || !notFoundChecks.previewProbeMarkerPresent) failures.push('preview probe contract failed')
if (blockingAlerts.length !== contract.requirements.blockingAlerts) failures.push(`blocking alerts ${blockingAlerts.length}`)

const acceptance = {
  schema: 'viewloom-phase12-release-acceptance-v1',
  phase: 'Phase 12',
  workstream: 'R12C-3 production closeout',
  status: failures.length === 0 ? 'complete' : 'failed',
  result: failures.length === 0 ? 'pass' : 'fail',
  checkedAt: new Date().toISOString(),
  workflowRunId: process.env.GITHUB_RUN_ID || null,
  expectedMainSha: contract.expectedMainSha,
  deployedSha: deployment.commit_sha,
  deployment: {
    environment: deployment.environment,
    branch: deployment.branch,
    matchesExpected: deployment.commit_sha === contract.expectedMainSha && deployment.environment === 'production' && deployment.branch === 'main',
  },
  candidateEvidence: {
    status: candidate.status,
    candidateHeadSha: candidate.candidateHeadSha,
    workflowRunId: candidate.workflowRunId,
    artifact: candidate.artifact,
    browserScenarios: candidate.browser?.scenarios ?? null,
    browserViolations: candidate.browser?.violations ?? null,
  },
  counts: {
    htmlRoutes: routeResults.length,
    statusApis: 2,
    sitemapRoutes: sitemapRouteCount,
    launchAssets: assetResults.length,
    blockingAlerts: blockingAlerts.length,
    watchAlerts: monitoring.alerts.filter((alert) => alert.severity === 'watch').length,
  },
  routes: routeResults,
  support: supportChecks,
  providers: providerChecks,
  monitoring,
  sitemap: {
    status: sitemap.response.status,
    routes: sitemapRouteCount,
  },
  launchAssets: assetResults,
  notFound: notFoundChecks,
  failures,
  nextWorkstream: failures.length === 0 ? 'Phase 12A Analytics Capture Foundation' : null,
}

writeFileSync(join(artifactDir, 'phase12-release-acceptance.json'), `${JSON.stringify(acceptance, null, 2)}\n`)
writeFileSync(outputPath, `${JSON.stringify(acceptance, null, 2)}\n`)
console.log(JSON.stringify({ result: acceptance.result, expectedMainSha: acceptance.expectedMainSha, deployedSha: acceptance.deployedSha, counts: acceptance.counts, failures }, null, 2))
if (failures.length) process.exitCode = 1
