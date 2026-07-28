#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const eventName = String(process.env.GITHUB_EVENT_NAME ?? '')
const before = String(process.env.GITHUB_EVENT_BEFORE ?? '')
const sha = String(process.env.GITHUB_SHA ?? '')
const requestedProvider = String(process.env.DEPLOY_PROVIDER ?? '').trim().toLowerCase()
const outputPath = String(process.env.GITHUB_OUTPUT ?? '')
const gate = JSON.parse(fs.readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))

const active = {
  twitch: gate?.categoryCapture?.twitchPermanentRuntimeCaptureActive === true,
  kick: gate?.categoryCapture?.kickPermanentRuntimeCaptureActive === true,
}
const configs = {
  twitch: active.twitch
    ? 'workers/collector-twitch/wrangler.category-permanent.toml'
    : 'workers/collector-twitch/wrangler.toml',
  kick: active.kick
    ? 'workers/collector-kick/wrangler.category-permanent.toml'
    : 'workers/collector-kick/wrangler.toml',
}

let changedFiles = []
let deployTwitch = false
let deployKick = false

if (eventName === 'workflow_dispatch') {
  if (!['twitch', 'kick', 'both'].includes(requestedProvider)) throw new Error('manual_provider_required')
  deployTwitch = requestedProvider === 'twitch' || requestedProvider === 'both'
  deployKick = requestedProvider === 'kick' || requestedProvider === 'both'
} else if (eventName === 'push') {
  if (!before || !sha || /^0+$/.test(before)) throw new Error('push_identity_missing')
  changedFiles = execFileSync('git', ['diff', '--name-only', before, sha], { encoding: 'utf8' })
    .split('\n').map((value) => value.trim()).filter(Boolean)
  const sharedChanged = changedFiles.some((value) => value.startsWith('workers/shared/'))
  deployTwitch = sharedChanged || changedFiles.some((value) => value.startsWith('workers/collector-twitch/'))
  deployKick = sharedChanged || changedFiles.some((value) => value.startsWith('workers/collector-kick/'))
} else if (eventName !== 'pull_request') {
  throw new Error(`unsupported_event:${eventName || 'missing'}`)
}

const result = {
  eventName,
  requestedProvider: requestedProvider || null,
  changedFiles,
  canonicalGateSchema: gate.schemaVersion,
  active,
  configs,
  deployTwitch,
  deployKick,
  anyDeploy: deployTwitch || deployKick,
  providerScoped: !(deployTwitch && !deployKick && changedFiles.some((value) => value.startsWith('workers/collector-kick/')))
    && !(deployKick && !deployTwitch && changedFiles.some((value) => value.startsWith('workers/collector-twitch/'))),
}

if (!result.providerScoped) throw new Error('cross_provider_deploy_plan')
if (outputPath) {
  fs.appendFileSync(outputPath, [
    `deploy_twitch=${deployTwitch}`,
    `deploy_kick=${deployKick}`,
    `any_deploy=${result.anyDeploy}`,
    `twitch_config=${configs.twitch}`,
    `kick_config=${configs.kick}`,
  ].join('\n') + '\n')
}
console.log(JSON.stringify(result, null, 2))
