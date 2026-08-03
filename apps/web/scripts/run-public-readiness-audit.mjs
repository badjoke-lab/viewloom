import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const directory = dirname(fileURLToPath(import.meta.url))
const sourcePath = join(directory, 'public-readiness-audit.mjs')
const temporaryPath = join(directory, '.public-readiness-audit-primary-domain.mjs')

const source = readFileSync(sourcePath, 'utf8')
  .replaceAll('https://www.viewloom.net', 'https://www.viewloom.net')
  .replaceAll('vl\\.badjoke-lab\\.com', 'www\\.viewloom\\.net')

writeFileSync(temporaryPath, source)
try {
  const result = spawnSync(process.execPath, [temporaryPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(temporaryPath, { force: true })
}
