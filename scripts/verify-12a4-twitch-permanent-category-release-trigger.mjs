import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { inspectReleaseTrigger } from './inspect-12a4-twitch-permanent-category-release-trigger.mjs'

const TRIGGER_PATH = 'docs/audits/12a4-twitch-permanent-category-release-trigger.json'
const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const changed = changedFiles()
assert.deepEqual(changed, [TRIGGER_PATH], `exact one-file release trigger required: ${JSON.stringify(changed)}`)
assert.equal(fs.existsSync(TRIGGER_PATH), true, 'release trigger must exist')

const contract = json('docs/audits/12a4-twitch-permanent-category-release-contract.json')
const gate = json(contract.acceptedPackage.canonicalGate)
const trigger = json(TRIGGER_PATH)
const normal = read(contract.acceptedPackage.rollbackConfig)
const permanent = read(contract.acceptedPackage.permanentConfig)
const inspected = inspectReleaseTrigger({ trigger, contract, gate, eventName: 'push', now: new Date() })

assert.equal(contract.status, 'accepted')
assert.equal(contract.acceptance.pr, 628)
assert.equal(/^[a-f0-9]{40}$/.test(contract.acceptance.mergeSha), true)
assert.equal(inspected.ok, true, JSON.stringify(inspected.failures))
assert.equal(inspected.action, 'start')
assert.equal(inspected.productionAuthorized, true)
assert.equal(trigger.releasePackageMergeSha, contract.acceptance.mergeSha)
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, contract.trigger.confirmation)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(normal.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1], '*/5 * * * *')
assert.equal(permanent.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1], '*/5 * * * *')

console.log(JSON.stringify({
  ok: true,
  changed,
  provider: 'twitch',
  startAt: trigger.startAt,
  releasePackagePr: trigger.releasePackagePr,
  releasePackageMergeSha: trigger.releasePackageMergeSha,
  exactOneFileTrigger: true,
  freshPreflightRequired: true,
  productionActivationFromPullRequest: false,
  kickChanged: false,
}, null, 2))

function changedFiles() {
  const baseRef = String(process.env.GITHUB_BASE_REF ?? '').trim()
  let range
  if (baseRef) {
    const base = `origin/${baseRef}`
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
    range = `${mergeBase}...HEAD`
  } else {
    const before = String(process.env.GITHUB_EVENT_BEFORE ?? '').trim()
    const validBefore = /^[a-f0-9]{40}$/i.test(before) && !/^0+$/.test(before)
    range = validBefore ? `${before}...HEAD` : 'HEAD^...HEAD'
  }
  return execFileSync('git', ['diff', '--name-only', range], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
}
