import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'

const rawDir = process.argv[2]
if (!rawDir) {
  console.error('usage: node run-12a4-kick-category-schema-recovery.mjs <raw-dir>')
  process.exit(2)
}
const apiToken = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
if (!apiToken || !accountId) throw new Error('Cloudflare recovery credentials are unavailable')
fs.mkdirSync(rawDir, { recursive: true })

const service = 'viewloom-kick-category-schema-recovery'
const config = 'workers/kick-category-schema-recovery/wrangler.toml'
const confirmation = 'APPLY_KICK_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'
const serviceUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/services/${service}`
const apiHeaders = { Authorization: `Bearer ${apiToken}` }
const token = crypto.randomBytes(32).toString('hex')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const lifecycle = {
  preExistingHttpStatus: 0,
  deployExitCode: 1,
  secretExitCode: 1,
  preInspectHttpStatus: 0,
  firstApplyHttpStatus: 0,
  secondApplyHttpStatus: 0,
  pollSucceeded: false,
  pollAttempts: 0,
  deleteExitCode: 1,
  postDeleteHttpStatus: 0,
}
let deployed = false

function wrangler(args, input) {
  return spawnSync('pnpm', ['dlx', 'wrangler@4', ...args], {
    encoding: 'utf8',
    env: process.env,
    input,
    maxBuffer: 10 * 1024 * 1024,
  })
}

async function post(url, output, apply = false) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(apply ? { 'x-viewloom-confirm': confirmation } : {}),
    },
  })
  fs.writeFileSync(path.join(rawDir, output), await response.text())
  return response.status
}

try {
  const before = await fetch(serviceUrl, { headers: apiHeaders })
  lifecycle.preExistingHttpStatus = before.status
  if (before.status !== 404) throw new Error(`temporary_worker_preexists_${before.status}`)

  const deploy = wrangler(['deploy', '--config', config])
  fs.writeFileSync(path.join(rawDir, 'deploy.log'), `${deploy.stdout ?? ''}\n${deploy.stderr ?? ''}`)
  lifecycle.deployExitCode = deploy.status ?? 1
  if (lifecycle.deployExitCode !== 0) throw new Error('deploy_failed')
  deployed = true

  const secret = wrangler(['secret', 'put', 'APPLY_TOKEN', '--config', config], `${token}\n`)
  fs.appendFileSync(path.join(rawDir, 'deploy.log'), `${secret.stdout ?? ''}\n${secret.stderr ?? ''}`)
  lifecycle.secretExitCode = secret.status ?? 1
  if (lifecycle.secretExitCode !== 0) throw new Error('secret_failed')

  const log = fs.readFileSync(path.join(rawDir, 'deploy.log'), 'utf8')
  const urls = log.match(/https:\/\/[^\s]+\.workers\.dev/g) ?? []
  const baseUrl = urls.at(-1)
  if (!baseUrl) throw new Error('worker_url_missing')

  for (let attempt = 1; attempt <= 40; attempt += 1) {
    lifecycle.preInspectHttpStatus = await post(`${baseUrl}/inspect`, 'pre.json')
    if (lifecycle.preInspectHttpStatus === 200) break
    await sleep(5000)
  }
  const pre = JSON.parse(fs.readFileSync(path.join(rawDir, 'pre.json'), 'utf8'))
  if (pre?.ok !== true || pre?.state?.schema?.absent !== true || pre?.state?.schema?.partial !== false) {
    throw new Error('kick_precondition_not_completely_absent')
  }

  lifecycle.firstApplyHttpStatus = await post(`${baseUrl}/apply`, 'first-apply.json', true)
  const first = JSON.parse(fs.readFileSync(path.join(rawDir, 'first-apply.json'), 'utf8'))
  if (lifecycle.firstApplyHttpStatus !== 200 || first?.ok !== true || first?.apply?.reason !== 'applied') {
    throw new Error('first_apply_failed')
  }

  lifecycle.secondApplyHttpStatus = await post(`${baseUrl}/apply`, 'second-apply.json', true)
  const second = JSON.parse(fs.readFileSync(path.join(rawDir, 'second-apply.json'), 'utf8'))
  if (lifecycle.secondApplyHttpStatus !== 200 || second?.ok !== true || second?.apply?.reason !== 'already-complete') {
    throw new Error('second_apply_not_noop')
  }

  const preLatest = pre?.state?.operational?.latestSnapshot?.collected_at
  for (let attempt = 1; attempt <= 70; attempt += 1) {
    lifecycle.pollAttempts = attempt
    const status = await post(`${baseUrl}/inspect`, 'post-candidate.json')
    const candidate = JSON.parse(fs.readFileSync(path.join(rawDir, 'post-candidate.json'), 'utf8'))
    const latest = candidate?.state?.operational?.latestSnapshot?.collected_at
    if (status === 200 && candidate?.ok === true && preLatest && latest && latest !== preLatest) {
      fs.copyFileSync(path.join(rawDir, 'post-candidate.json'), path.join(rawDir, 'post.json'))
      lifecycle.pollSucceeded = true
      break
    }
    await sleep(5000)
  }
} catch (error) {
  fs.writeFileSync(path.join(rawDir, 'runner-error.txt'), String(error).slice(0, 240))
} finally {
  if (deployed) {
    try {
      const deleted = await fetch(serviceUrl, { method: 'DELETE', headers: { ...apiHeaders, 'Content-Type': 'application/json' } })
      const result = await deleted.json().catch(() => null)
      lifecycle.deleteExitCode = result?.success === true ? 0 : 1
    } catch {
      lifecycle.deleteExitCode = 1
    }
    try {
      const after = await fetch(serviceUrl, { headers: apiHeaders })
      lifecycle.postDeleteHttpStatus = after.status
    } catch {
      lifecycle.postDeleteHttpStatus = 0
    }
  }
  fs.writeFileSync(path.join(rawDir, 'lifecycle.json'), `${JSON.stringify(lifecycle, null, 2)}\n`)
}

console.log(JSON.stringify({ ok: true, lifecycle }, null, 2))
