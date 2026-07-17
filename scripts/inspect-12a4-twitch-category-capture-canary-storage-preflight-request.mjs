import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectRequest } from './run-12a4-twitch-category-capture-canary-storage-preflight.mjs'

export function inspectRequestFile({ requestPath, contractPath }) {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  if (!fs.existsSync(requestPath)) {
    return {
      ok: true,
      present: false,
      action: 'noop',
      reason: 'request_absent',
      failures: [],
    }
  }
  const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'))
  const inspected = inspectRequest(request, contract)
  return {
    ok: inspected.ok,
    present: true,
    action: inspected.ok ? 'observe' : 'reject',
    provider: request.provider ?? null,
    requestedAt: request.requestedAt ?? null,
    failures: inspected.failures,
  }
}

function writeOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) return
  const values = {
    present: String(result.present === true),
    action: String(result.action ?? 'noop'),
    provider: String(result.provider ?? ''),
    requested_at: String(result.requestedAt ?? ''),
  }
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`,
  )
}

async function main() {
  const requestPath = process.env.REQUEST_PATH
    ?? 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json'
  const contractPath = process.env.CONTRACT_PATH
    ?? 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json'
  const result = inspectRequestFile({ requestPath, contractPath })
  writeOutputs(result)
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
