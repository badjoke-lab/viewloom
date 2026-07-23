import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIRMATION = 'RUN_KICK_PERMANENT_CATEGORY_RELEASE'

export function inspectReleaseTrigger({ trigger, contract, gate, eventName = 'pull_request', now = new Date() }) {
  if (!trigger) {
    return {
      ok: true,
      present: false,
      action: 'noop',
      provider: 'kick',
      productionAuthorized: false,
      failures: [],
    }
  }

  const failures = []
  const check = (name, condition, actual = undefined) => {
    if (!condition) failures.push({ name, actual })
  }
  const start = parseDate(trigger.startAt)
  const nowMs = now.getTime()
  const startDelayMs = start && Number.isFinite(nowMs) ? start.getTime() - nowMs : null
  const maximumDelayMs = Number(contract?.trigger?.maximumStartDelayHours ?? 0) * 60 * 60 * 1000

  check('trigger schema', trigger.schemaVersion === contract.trigger.schemaVersion, trigger.schemaVersion)
  check('trigger armed', trigger.status === contract.trigger.status, trigger.status)
  check('provider Kick', trigger.provider === 'kick', trigger.provider)
  check('one time', trigger.oneTime === true, trigger.oneTime)
  check('confirmation', trigger.confirmation === CONFIRMATION, trigger.confirmation)
  check('implementation PR', trigger.implementationPr === contract.trigger.implementationPr, trigger.implementationPr)
  check('implementation merge', trigger.implementationMergeSha === contract.trigger.implementationMergeSha, trigger.implementationMergeSha)
  check('acceptance PR', trigger.acceptancePr === contract.trigger.acceptancePr, trigger.acceptancePr)
  check('acceptance merge', trigger.acceptanceMergeSha === contract.trigger.acceptanceMergeSha, trigger.acceptanceMergeSha)
  check('release package PR', trigger.releasePackagePr === contract.trigger.releasePackagePr, trigger.releasePackagePr)
  check('release package merge SHA', /^[a-f0-9]{40}$/.test(String(trigger.releasePackageMergeSha ?? '')), trigger.releasePackageMergeSha)
  check('release package accepted identity', trigger.releasePackageMergeSha === contract.acceptance?.mergeSha, trigger.releasePackageMergeSha)
  check('start timestamp', Boolean(start), trigger.startAt)
  check('start not expired', start !== null && nowMs < start.getTime() + maximumDelayMs, startDelayMs)
  check('start within runner limit', startDelayMs !== null && startDelayMs <= maximumDelayMs, startDelayMs)
  check('canonical gate schema', gate?.schemaVersion === contract.acceptedPackage.requiredGateSchemaVersion, gate?.schemaVersion)
  check('canonical gate phase', gate?.currentWorkstream?.phase === contract.acceptedPackage.requiredGatePhase, gate?.currentWorkstream?.phase)
  check('Kick implementation package accepted', gate?.currentWorkstream?.kickPermanentPackageAccepted === true, gate?.currentWorkstream?.kickPermanentPackageAccepted)
  check('Kick release package accepted', gate?.currentWorkstream?.kickReleasePackageAccepted === true, gate?.currentWorkstream?.kickReleasePackageAccepted)
  check('Kick runtime inactive before release', gate?.currentWorkstream?.kickPermanentCaptureActive === false, gate?.currentWorkstream?.kickPermanentCaptureActive)
  check('Twitch runtime remains active', gate?.currentWorkstream?.twitchPermanentCaptureActive === true, gate?.currentWorkstream?.twitchPermanentCaptureActive)
  check('public Twitch filter remains unauthorized', gate?.currentWorkstream?.twitchHeatmapCategoryFilterPublicExposureAuthorized === false, gate?.currentWorkstream?.twitchHeatmapCategoryFilterPublicExposureAuthorized)

  const ok = failures.length === 0
  return {
    ok,
    present: true,
    action: ok && eventName === 'push' ? 'start' : ok ? 'validate' : 'reject',
    provider: 'kick',
    startAt: start?.toISOString() ?? null,
    startDelayMs,
    releasePackageMergeSha: trigger.releasePackageMergeSha ?? null,
    productionAuthorized: ok && eventName === 'push',
    failures,
  }
}

function parseDate(value) {
  const date = new Date(String(value ?? ''))
  return Number.isFinite(date.getTime()) ? date : null
}

function main() {
  const requireArmed = process.argv.includes('--require-armed')
  const eventName = argument('--event') ?? process.env.GITHUB_EVENT_NAME ?? 'pull_request'
  const triggerPath = 'docs/audits/12a4-kick-permanent-category-release-trigger.json'
  const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-kick-permanent-category-release-contract.json', 'utf8'))
  const gate = JSON.parse(fs.readFileSync(contract.acceptedPackage.canonicalGate, 'utf8'))
  const trigger = fs.existsSync(triggerPath) ? JSON.parse(fs.readFileSync(triggerPath, 'utf8')) : null
  const result = inspectReleaseTrigger({ trigger, contract, gate, eventName })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok || (requireArmed && result.action !== 'start')) process.exit(1)
  writeOutput('action', result.action)
  writeOutput('start_at', result.startAt ?? '')
}

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()