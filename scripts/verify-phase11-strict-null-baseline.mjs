import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-strict-null-baseline/strict-null-baseline.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-strict-null-baseline-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11A')
assert.equal(evidence.baseStrictIntent, true)
assert.equal(evidence.currentOverridePresent, true)
assert.equal(Array.isArray(evidence.scopes), true)
assert.equal(evidence.scopes.length, 2)
assert.deepEqual(evidence.scopes.map((scope) => scope.scope).sort(), ['app', 'functions'])

for (const scope of evidence.scopes) {
  assert.equal(typeof scope.project, 'string')
  assert.equal(Number.isInteger(scope.exitCode), true)
  assert.equal(Number.isInteger(scope.errorCount), true)
  assert.equal(Number.isInteger(scope.affectedFileCount), true)
  assert.equal(Array.isArray(scope.affectedFiles), true)
  assert.equal(scope.affectedFileCount, scope.affectedFiles.length)
  assert.ok(scope.status === 'clean' || scope.status === 'debt-recorded')
  if (scope.status === 'clean') {
    assert.equal(scope.errorCount, 0)
    assert.equal(scope.exitCode, 0)
  }
}

assert.equal(Number.isInteger(evidence.totals.errorCount), true)
assert.equal(Number.isInteger(evidence.totals.affectedFileCount), true)
assert.equal(Number.isInteger(evidence.totals.cleanScopeCount), true)
assert.equal(evidence.totals.errorCount, evidence.scopes.reduce((sum, scope) => sum + scope.errorCount, 0))

console.log('Phase 11 strict-null baseline evidence verification passed.')
console.log(`- total errors: ${evidence.totals.errorCount}`)
console.log(`- affected files: ${evidence.totals.affectedFileCount}`)
console.log(`- clean scopes: ${evidence.totals.cleanScopeCount}/2`)
