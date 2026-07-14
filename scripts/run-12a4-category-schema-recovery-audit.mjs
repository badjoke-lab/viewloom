import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'

const rawDir = process.argv[2]
if (!rawDir) {
  console.error('usage: node run-12a4-category-schema-recovery-audit.mjs <raw-dir>')
  process.exit(2)
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
if (!apiToken || !accountId) throw new Error('Cloudflare audit credentials are unavailable')
fs.mkdirSync(rawDir, { recursive: true })

const providers = {
  twitch: {
    service: 'viewloom-category-cost-preflight-twitch',
    config: 'workers/category-cost-probe/wrangler.twitch.toml',
  },
  kick: {
    service: 'viewloom-category-cost-preflight-kick',
    config: 'workers/category-cost-probe/wrangler.kick.toml',
  },
}

const executionStatus = { providers: { twitch: { attempted: false }, kick: { attempted: false } } }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const serviceUrl = (service) => `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/services/${service}`
const apiHeaders = { Authorization: `Bearer ${apiToken}` }

function runWrangler(args, options = {}) {
  return spawnSync('pnpm', ['dlx', 'wrangler@4', ...args], {
    encoding: 'utf8',
    env: process.env,
    input: options.input,
    maxBuffer: 10 * 1024 * 1024,
  })
}

async function inspectProvider(provider, spec) {
  const lifecycle = {
    preExistingCurlExitCode: 1,
    preExistingHttpStatus: 0,
    deployExitCode: 1,
    secretExitCode: 1,
    inspectCurlExitCode: 1,
    inspectHttpStatus: 0,
    deleteExitCode: 1,
    deleteCurlExitCode: 1,
    deleteHttpStatus: 0,
  }
  const inspectFile = path.join(rawDir, `${provider}-inspect.json`)
  const deployLog = path.join(rawDir, `${provider}-deploy.log`)
  let deployed = false

  try {
    const before = await fetch(serviceUrl(spec.service), { headers: apiHeaders })
    lifecycle.preExistingCurlExitCode = 0
    lifecycle.preExistingHttpStatus = before.status
    if (before.status !== 404) return lifecycle

    const deploy = runWrangler(['deploy', '--config', spec.config])
    fs.writeFileSync(deployLog, `${deploy.stdout ?? ''}\n${deploy.stderr ?? ''}`)
    lifecycle.deployExitCode = deploy.status ?? 1
    if (lifecycle.deployExitCode !== 0) return lifecycle
    deployed = true

    const probeToken = crypto.randomBytes(32).toString('hex')
    const secret = runWrangler(['secret', 'put', 'PROBE_TOKEN', '--config', spec.config], { input: `${probeToken}\n` })
    fs.appendFileSync(deployLog, `${secret.stdout ?? ''}\n${secret.stderr ?? ''}`)
    lifecycle.secretExitCode = secret.status ?? 1
    if (lifecycle.secretExitCode !== 0) return lifecycle

    const log = fs.readFileSync(deployLog, 'utf8')
    const matches = log.match(/https:\/\/[^\s]+\.workers\.dev/g) ?? []
    const url = matches.at(-1)
    if (!url) return lifecycle

    for (let attempt = 1; attempt <= 40; attempt += 1) {
      try {
        const response = await fetch(`${url}/inspect`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${probeToken}` },
        })
        lifecycle.inspectCurlExitCode = 0
        lifecycle.inspectHttpStatus = response.status
        fs.writeFileSync(inspectFile, await response.text())
        if (response.status === 200) break
      } catch (error) {
        lifecycle.inspectCurlExitCode = 1
        fs.writeFileSync(inspectFile, String(error).slice(0, 240))
      }
      await sleep(5000)
    }
  } finally {
    if (deployed) {
      try {
        const deleted = await fetch(serviceUrl(spec.service), {
          method: 'DELETE',
          headers: { ...apiHeaders, 'Content-Type': 'application/json' },
        })
        lifecycle.deleteCurlExitCode = 0
        const result = await deleted.json().catch(() => null)
        lifecycle.deleteExitCode = result?.success === true ? 0 : 1
      } catch {
        lifecycle.deleteCurlExitCode = 1
      }
      try {
        const after = await fetch(serviceUrl(spec.service), { headers: apiHeaders })
        lifecycle.deleteCurlExitCode = 0
        lifecycle.deleteHttpStatus = after.status
      } catch {
        lifecycle.deleteCurlExitCode = 1
      }
    }
    fs.writeFileSync(path.join(rawDir, `${provider}-lifecycle.json`), `${JSON.stringify(lifecycle, null, 2)}\n`)
  }
  return lifecycle
}

for (const provider of ['twitch', 'kick']) {
  executionStatus.providers[provider].attempted = true
  await inspectProvider(provider, providers[provider])
  fs.writeFileSync(path.join(rawDir, 'execution-status.json'), `${JSON.stringify(executionStatus, null, 2)}\n`)
}

console.log(JSON.stringify({ ok: true, attempted: executionStatus.providers }, null, 2))
