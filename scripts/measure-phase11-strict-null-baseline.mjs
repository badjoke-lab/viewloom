import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { spawnSync } from 'node:child_process'

const outputPath = process.argv[2] || 'artifacts/phase11-strict-null-baseline/strict-null-baseline.json'
const scopes = [
  { name: 'app', project: 'apps/web/tsconfig.json' },
  { name: 'functions', project: 'apps/web/tsconfig.functions.json' },
]

const results = scopes.map(({ name, project }) => {
  const run = spawnSync('pnpm', ['exec', 'tsc', '-p', project, '--noEmit', '--strictNullChecks', 'true', '--pretty', 'false'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })

  if (run.error) throw run.error

  const output = `${run.stdout || ''}${run.stderr || ''}`
  const errorMatches = output.match(/error TS\d+:/g) || []
  const fileMatches = [...output.matchAll(/^(.+?)\(\d+,\d+\): error TS\d+:/gm)].map((match) => match[1])
  const files = [...new Set(fileMatches)].sort()

  return {
    scope: name,
    project,
    exitCode: run.status ?? 1,
    errorCount: errorMatches.length,
    affectedFileCount: files.length,
    affectedFiles: files,
    status: errorMatches.length === 0 && run.status === 0 ? 'clean' : 'debt-recorded',
  }
})

const evidence = {
  schema: 'viewloom-phase11-strict-null-baseline-v1',
  phase: 'Phase 11',
  workstream: 'P11A',
  generatedAt: new Date().toISOString(),
  baseStrictIntent: true,
  currentOverridePresent: true,
  scopes: results,
  totals: {
    errorCount: results.reduce((sum, item) => sum + item.errorCount, 0),
    affectedFileCount: new Set(results.flatMap((item) => item.affectedFiles)).size,
    cleanScopeCount: results.filter((item) => item.status === 'clean').length,
  },
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify(evidence, null, 2))
