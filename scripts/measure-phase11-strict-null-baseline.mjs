import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
  const diagnostics = [...output.matchAll(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm)].map((match) => ({
    file: match[1],
    line: Number(match[2]),
    column: Number(match[3]),
    code: match[4],
    message: match[5],
  }))
  const files = [...new Set(diagnostics.map((item) => item.file))].sort()

  return {
    scope: name,
    project,
    exitCode: run.status ?? 1,
    errorCount: diagnostics.length,
    affectedFileCount: files.length,
    affectedFiles: files,
    diagnostics,
    status: diagnostics.length === 0 && run.status === 0 ? 'clean' : 'debt-recorded',
  }
})

const webPackage = JSON.parse(readFileSync('apps/web/package.json', 'utf8'))
const typecheckScripts = ['typecheck', 'typecheck:app', 'typecheck:functions']
const currentOverridePresent = typecheckScripts.some((name) => String(webPackage.scripts?.[name] ?? '').includes('--strictNullChecks false'))

const evidence = {
  schema: 'viewloom-phase11-strict-null-baseline-v1',
  phase: 'Phase 11',
  workstream: 'P11A',
  generatedAt: new Date().toISOString(),
  baseStrictIntent: true,
  currentOverridePresent,
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
