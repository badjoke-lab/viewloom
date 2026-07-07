import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const artifactDir = process.argv[2] || 'artifacts/production-smoke'
const expectedSha = process.env.EXPECTED_MAIN_SHA || process.env.GITHUB_SHA || ''
const outputPath = join(artifactDir, 'phase11-monitoring-evidence.json')

const readJson = (name) => JSON.parse(readFileSync(join(artifactDir, name), 'utf8'))
const deployment = readJson('deployment.json')
const twitch = readJson('twitch-status.json')
const kick = readJson('kick-status.json')

const ratio = (observed, limit) => {
  if (!Number.isFinite(observed) || !Number.isFinite(limit) || limit <= 0) return null
  return Number((observed / limit).toFixed(4))
}

const capacityState = ({ observed, limit, hasMore = false }) => {
  const utilization = ratio(observed, limit)
  if (hasMore || (utilization != null && utilization >= 1)) return 'at-or-over-window'
  if (utilization != null && utilization >= 0.9) return 'near-window-limit'
  return 'within-window'
}

const evidence = {
  schema: 'viewloom-phase11-monitoring-evidence-v1',
  phase: 'Phase 11',
  workstream: 'P11C',
  generatedAt: new Date().toISOString(),
  deployment: {
    expectedMainSha: expectedSha || null,
    deployedSha: deployment.commit_sha ?? null,
    environment: deployment.environment ?? null,
    branch: deployment.branch ?? null,
    matchesExpected: Boolean(expectedSha) && deployment.commit_sha === expectedSha && deployment.environment === 'production' && deployment.branch === 'main',
  },
  providers: {
    twitch: {
      platform: twitch.platform ?? null,
      storage: twitch.storage ?? null,
      sourceMode: twitch.sourceMode ?? null,
      state: twitch.state ?? null,
      collectorState: twitch.collector?.state ?? null,
      freshness: {
        lastSuccessAt: twitch.freshness?.lastSuccessAt ?? null,
        minutesSinceSuccess: twitch.freshness?.minutesSinceSuccess ?? null,
        staleAfterMinutes: twitch.freshness?.staleAfterMinutes ?? null,
        strongStaleAfterMinutes: twitch.freshness?.strongStaleAfterMinutes ?? null,
        isFresh: twitch.freshness?.isFresh ?? null,
        isStale: twitch.freshness?.isStale ?? null,
        isStrongStale: twitch.freshness?.isStrongStale ?? null,
      },
      capacity: {
        observedCount: twitch.latestSnapshot?.observedCount ?? 0,
        topLimit: twitch.latestSnapshot?.topLimit ?? null,
        utilizationRatio: ratio(twitch.latestSnapshot?.observedCount, twitch.latestSnapshot?.topLimit),
        hasMore: twitch.latestSnapshot?.hasMore ?? false,
        coveredPages: twitch.latestSnapshot?.coveredPages ?? null,
        state: capacityState({
          observed: twitch.latestSnapshot?.observedCount,
          limit: twitch.latestSnapshot?.topLimit,
          hasMore: twitch.latestSnapshot?.hasMore === true,
        }),
      },
    },
    kick: {
      platform: kick.platform ?? null,
      storage: kick.storage ?? null,
      sourceMode: kick.sourceMode ?? null,
      authMode: kick.authMode ?? null,
      state: kick.state ?? null,
      collectorState: kick.collector?.state ?? null,
      coverageMode: kick.coverageMode ?? null,
      targetSource: kick.targetSource ?? null,
      freshness: {
        lastSuccessAt: kick.freshness?.lastSuccessAt ?? null,
        minutesSinceSuccess: kick.freshness?.minutesSinceSuccess ?? null,
        staleAfterMinutes: kick.freshness?.staleAfterMinutes ?? null,
        strongStaleAfterMinutes: kick.freshness?.strongStaleAfterMinutes ?? null,
        isFresh: kick.freshness?.isFresh ?? null,
        isStale: kick.freshness?.isStale ?? null,
      },
      capacity: {
        observedCount: kick.latestSnapshot?.observedCount ?? 0,
        topLimit: kick.latestSnapshot?.topLimit ?? null,
        utilizationRatio: ratio(kick.latestSnapshot?.observedCount, kick.latestSnapshot?.topLimit),
        state: capacityState({
          observed: kick.latestSnapshot?.observedCount,
          limit: kick.latestSnapshot?.topLimit,
        }),
      },
      coverage: {
        mode: kick.coverageMode ?? null,
        registryCandidateCount: kick.registryCandidateCount ?? null,
        configuredChannels: kick.collector?.configuredChannels ?? null,
        attemptedChannels: kick.collector?.attemptedChannels ?? null,
        observedSlugsCount: Array.isArray(kick.collector?.observedSlugs) ? kick.collector.observedSlugs.length : null,
        missedSlugsCount: Array.isArray(kick.collector?.missedSlugs) ? kick.collector.missedSlugs.length : null,
      },
    },
  },
  alerts: [],
}

if (!evidence.deployment.matchesExpected) evidence.alerts.push({ severity: 'critical', code: 'deployment_identity_mismatch', owner: 'deployment' })
for (const provider of ['twitch', 'kick']) {
  const item = evidence.providers[provider]
  if (item.freshness.isStale === true) evidence.alerts.push({ severity: 'high', code: `${provider}_stale`, owner: provider })
  if (item.capacity.state !== 'within-window') evidence.alerts.push({ severity: 'watch', code: `${provider}_${item.capacity.state}`, owner: provider })
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ deployment: evidence.deployment, alerts: evidence.alerts }, null, 2))
